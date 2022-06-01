const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
const port = 3000;
app.use(express.static("public"));
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Connecting to database
mongoose.connect("mongodb://localhost:27017/todoListDB");

//Create Schema
const itemsSchema = mongoose.Schema({
  name: String,
});

//Create Model
const Item = mongoose.model("Item", itemsSchema);

//Creating documents

const item1 = new Item({
  name: "Welcome ",
});
const item2 = new Item({
  name: "Swagat Hai ",
});
const item3 = new Item({
  name: "Aaiyee",
});
const defaultItems = [item1, item2, item3];
const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);
app.get("/", (req, res) => {
  //Reading Data form Database

  Item.find({}, (err, result) => {
    if (result.length == 0) {
      //Saving default Data n MongoDb
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully Saved Default Items");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        title: "Today",
        newListItems: result,
      });
    }
  });
});
app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  //Creating Item Document
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});
app.post("/delete", (req, res) => {
  const listName = req.body.listName;
  const checkedItemId = req.body.checkbox;
  if (listName === "Today") {
    Item.deleteOne({ _id: checkedItemId }, (err) => {});
    // Item.findByIdAndRemove({ _id: req.body.checkbox }, (err) => {});
    // Item.findByIdAndDelete({ _id: req.body.checkbox }, (err) => {});

    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //Create a new List
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show Existing list
        res.render("list", {
          title: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

const getDay = () => {
  const today = new Date();
  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  let day = today.toLocaleDateString("en-US", options);
  return day;
};
