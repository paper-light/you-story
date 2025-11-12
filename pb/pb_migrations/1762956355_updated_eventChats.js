/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1358379819")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = storyEvent.story.user",
    "listRule": "@request.auth.id = storyEvent.story.user",
    "updateRule": "@request.auth.id = storyEvent.story.user",
    "viewRule": "@request.auth.id = storyEvent.story.user"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1358379819")

  // update collection data
  unmarshal({
    "createRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
