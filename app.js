const express = require('express')
const bodyParser = require('body-parser');
let _ = require('lodash');
const ejs = require('ejs');
const date = require(__dirname + "/date.js");
require('dotenv').config()

const port = process.env.PORT
const workTodoList = ["set databases", "programming for 25 min", "Pause for 5 min"]


const app = express()
app.use(express.static("public"))
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }))


// <------------ mongoDB/ mongoose------------->

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// Connect MongoDB at default port 27017.
mongoose.connect('mongodb://localhost:27017/todolistDB');

const itemsSchema = { name: { type: String, default: "take 5 min break !" } }
const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({ name: "Welcome to your todolist!" });
const item2 = new Item({ name: "Hit the + button to add a new item" });
const item3 = new Item({ name: "<--- Check this to delete an item." });

const defaultItems = [item1, item2, item3]


const listSchema = { name: String, items: [itemsSchema] }

const List = mongoose.model("List", listSchema)



async function getItems() {
    const Items = await Item.find({});
    return Items;
}
async function getList(ListName) {
    const list = await List.findOne({ name: ListName });
    return list;
}
async function deletedItem(checkedItemId, listName) {
    if (listName === "Today") {
        const deleteResult = await Item.findByIdAndRemove(checkedItemId)
    } else {
        const deleteResult = await List.findOneAndUpdate({name: listName},{ $pull: {items: {_id: checkedItemId}}})
    }
    return;
}



app.get("/", (req, res) => {
    getItems().then((FoundItems) => {
        if (FoundItems.length === 0) {
            Item.insertMany(defaultItems);
            res.redirect("/")
        } else {
            res.render("list", { listTitle: "Today", kindOfToDos: FoundItems });
        }
    });
});


app.post('/', (req, res) => {
    let itemName = req.body.newTodo.trim()
    let listName = req.body.list
    const item = new Item({ name: itemName })

    if (listName === "Today") {
        item.save();
        res.redirect("/")
    }
    else {
        getList(listName).then(foundList => {
            if (foundList) {
                foundList.items.push(item)
                foundList.save()
                res.redirect(`${listName}`)
            }
        })
    }

}
)


app.post('/delete', (req, res) => {
    const checkedItemId = req.body.checkbox
    const listName = req.body.list
    deletedItem(checkedItemId, listName)
    if (listName === "Today") {
        res.redirect("/")
    } else {
        res.redirect(`/${listName}`)
    }
});



app.get('/:customListName', (req, res) => {
    const customListName = _.capitalize(req.params.customListName)
    getList(customListName).then(list => {
        if (list) {
            res.render("list", { listTitle: list.name, kindOfToDos: list.items })
        } else {
            const list = new List({ name: customListName, items: defaultItems })
            list.save()
            res.redirect(`/${customListName}`)

        }
    })
})


app.listen(port, () =>
    console.log(`Server running at http://localhost:${port}/`)
);

