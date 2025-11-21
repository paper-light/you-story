import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripe, getPriceByLookup } from '$lib/server/stripe';
import { env } from '$env/dynamic/public';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const { price: priceLookup, returnUrl } = await request.json();

	if (!priceLookup || !returnUrl) error(400, 'Missing price or returnUrl');

	const user = locals.user;
	const sub = locals.sub;

	// Check for active subscription if trying to subscribe
	// If it's a bundle (one-time), we allow it even if subscribed?
	// User said: "bundle" which subtracts usage.
	// Let's assume bundles are always allowed.
	const isBundle = priceLookup.startsWith('bundle');

	if (!isBundle && sub && ['active', 'trialing', 'past_due'].includes(sub.status || '')) {
		// Already subscribed, redirect to portal
		// But wait, the user might want to upgrade/downgrade?
		// The legacy code redirected to portal if active.
		// "if sub_status in {"active", "trialing", "past_due"} ... portal = ..."
		// So we follow legacy behavior: if active sub, go to portal.
		if (sub.stripeCustomer) {
			const portal = await stripe.billingPortal.sessions.create({
				customer: sub.stripeCustomer,
				return_url: `${env.PUBLIC_APP_URL}${returnUrl}`
			});
			return json({ url: portal.url });
		}
	}

	const price = await getPriceByLookup(priceLookup);
	if (!price) {
		error(400, 'Invalid price');
	}

	const customerEmail = user.email;
	const stripeCustomer = sub?.stripeCustomer;

	const sessionConfig: any = {
		line_items: [{ price: price.id, quantity: 1 }],
		mode: isBundle ? 'payment' : 'subscription',
		success_url: `${env.PUBLIC_APP_URL}${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${env.PUBLIC_APP_URL}${returnUrl}`,
		client_reference_id: user.id,
		metadata: { user_id: user.id, type: isBundle ? 'bundle' : 'subscription' },
		allow_promotion_codes: true,
		billing_address_collection: 'auto'
	};

	if (stripeCustomer) {
		sessionConfig.customer = stripeCustomer;
	} else {
		sessionConfig.customer_email = customerEmail;
	}

	try {
		const session = await stripe.checkout.sessions.create(sessionConfig);
		return json({ url: session.url });
	} catch (err: any) {
		console.error('Stripe checkout error:', err);
		error(400, `Stripe error: ${err.message}`);
	}
};
