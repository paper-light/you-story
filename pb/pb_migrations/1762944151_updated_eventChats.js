/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1358379819")

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select3457822251",
    "maxSelect": 1,
    "name": "commitMode",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "noncanonical",
      "propose_diffs",
      "auto_commit"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1358379819")

  // remove field
  collection.fields.removeById("select3457822251")

  return app.save(collection)
})
