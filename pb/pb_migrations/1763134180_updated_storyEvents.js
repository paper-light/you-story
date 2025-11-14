/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4070718775")

  // add field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_4070718775",
    "hidden": false,
    "id": "relation3168962645",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "prev",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4070718775")

  // remove field
  collection.fields.removeById("relation3168962645")

  return app.save(collection)
})
