/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4070718775")

  // add field
  collection.fields.addAt(6, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3298390430",
    "hidden": false,
    "id": "relation975782158",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "characters",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4070718775")

  // remove field
  collection.fields.removeById("relation975782158")

  return app.save(collection)
})
