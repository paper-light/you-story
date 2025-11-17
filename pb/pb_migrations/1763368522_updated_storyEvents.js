/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4070718775")

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "number1898533851",
    "max": null,
    "min": null,
    "name": "diffMonths",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4070718775")

  // remove field
  collection.fields.removeById("number1898533851")

  return app.save(collection)
})
