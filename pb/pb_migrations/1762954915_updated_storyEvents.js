/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4070718775")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = story.user",
    "listRule": "@request.auth.id = story.user",
    "updateRule": "@request.auth.id = story.user",
    "viewRule": "@request.auth.id = story.user"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4070718775")

  // update collection data
  unmarshal({
    "createRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
