/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1358379819")

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3298390430",
    "hidden": false,
    "id": "relation3754333175",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "povCharacter",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1358379819")

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3298390430",
    "hidden": false,
    "id": "relation3754333175",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "userCharacter",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
