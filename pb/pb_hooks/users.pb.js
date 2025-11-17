/// <reference path="../pb_data/types.d.ts" />

onRecordCreate((e) => {
	// before creation

	e.next();

	$app.runInTransaction((txApp) => {
		// do something in the transaction
		const col = txApp.findCollectionByNameOrId('subs');
		const record = new Record(col);
		record.set('user', e.record.id);
		txApp.save(record);

		const charCol = txApp.findCollectionByNameOrId('characters');
		const charRecord = new Record(charCol);
		charRecord.set('user', e.record.id);
		charRecord.set('name', e.record.get('name'));
		txApp.save(charRecord);
	});

	// after creation
}, 'users');
