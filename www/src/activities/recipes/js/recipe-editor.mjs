/*
  Copyright 2021 David Healey

  This file is part of Waistline.

  Waistline is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Waistline is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Waistline.  If not, see <http://www.gnu.org/licenses/>.
*/

import * as Utils from "/www/assets/js/utils.js";
import {
  renderItem
} from "/www/src/activities/foods-meals-recipes/foods-meals-recipes.mjs";

// The item being edited
let recipe;

const components = {};

async function init(context) {

  getComponents();

  if (context) {

    // From recipe list
    if (context.recipe) {
      recipe = context.recipe;
      populateInputs(recipe);
    }

    // From food list
    if (context.items)
      addItems(context.items);

    // From recipe editor
    if (context.item)
      replaceListItem(context.item);

    renderNutrition();
    await renderRecipe();
  }

  bindUIActions();
}

function getComponents() {
  components.submit = document.querySelector(".page[data-name='recipe-editor'] #submit");
  components.nameInput = document.querySelector(".page[data-name='recipe-editor'] #name");
  components.foodlist = document.querySelector(".page[data-name='recipe-editor'] #recipe-food-list");
  components.fab = document.querySelector(".page[data-name='recipe-editor'] #add-food");
  components.nutrition = document.querySelector(".page[data-name='recipe-editor'] #recipe-nutrition");
  components.swiperWrapper = document.querySelector(".page[data-name='recipe-editor'] .swiper-wrapper");
}

function bindUIActions() {

  // Submit
  if (!components.submit.hasClickEvent) {
    components.submit.addEventListener("click", (e) => {
      saveRecipe();
    });
    components.submit.hasClickEvent = true;
  }

  // Fab
  if (!components.fab.hasClickEvent) {
    components.fab.addEventListener("click", (e) => {
      f7.views.main.router.navigate("/foods-meals-recipes/", {
        context: {
          origin: "./recipe-editor/",
          recipe: recipe
        },
      });
    });
    components.fab.hasClickEvent = true;
  }
}

function populateInputs(recipe) {
  let inputs = document.querySelectorAll(".page[data-name='recipe-editor'] input, .page[data-name='recipe-editor'] textarea");

  inputs.forEach((x) => {
    if (recipe[x.name] !== undefined)
      x.value = recipe[x.name];
  });
}

function addItems(data) {

  let result = recipe.items;

  data.forEach((x) => {
    let item = {
      id: x.id,
      portion: x.portion,
      quantity: 1,
      type: "food"
    };
    result.push(item);
  });
  recipe.items = result;
}

function removeItem(item, li) {
  let title = waistline.strings["confirm-delete-title"] || "Delete";
  let text = waistline.strings["confirm-delete"] || "Are you sure?";
  let dialog = f7.dialog.confirm(text, title, callbackOk);

  function callbackOk() {
    recipe.items.splice(item.index, 1);
    li.parentNode.removeChild(li);
    renderNutrition();
  }
}

function saveRecipe() {

  let inputs = document.querySelectorAll(".page[data-name='recipe-editor'] input, .page[data-name='recipe-editor'] textarea");

  inputs.forEach((x) => {
    if (x.value !== undefined && x.value != "")
      recipe[x.name] = x.value;
  });

  let now = new Date();
  recipe.dateTime = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  dbHandler.put(recipe, "recipes").onsuccess = () => {
    f7.views.main.router.navigate("/foods-meals-recipes/recipes/");
  };
}

function replaceListItem(item) {
  recipe.items.splice(item.index, 1, item);
}

async function renderNutrition() {
  let now = new Date();
  let nutrition = await waistline.FoodsMealsRecipes.getTotalNutrition(recipe.items);

  let swiper = f7.swiper.get("#recipe-nutrition-swiper");
  components.swiperWrapper.innerHTML = "";
  waistline.FoodsMealsRecipes.renderNutritionCard(nutrition, now, swiper);
}

function renderRecipe() {
  return new Promise(async function(resolve, reject) {

    // Render the food list 
    components.foodlist.innerHTML = "";

    recipe.items.forEach(async (x, i) => {
      let item = await waistline.FoodsMealsRecipes.getItem(x.id, "food", x.portion, x.quantity);
      item.index = i;
      renderItem(item, components.foodlist, false, undefined, removeItem);
    });

    resolve();
  });
}

document.addEventListener("page:init", function(event) {
  if (event.detail.name == "recipe-editor") {
    let context = f7.data.context;
    f7.data.context = undefined;
    // Clear old recipe
    recipe = {
      items: []
    };

    init(context);
  }
});

document.addEventListener("page:reinit", function(event) {
  if (event.detail.name == "recipe-editor") {
    let context = f7.data.context;
    f7.data.context = undefined;

    init(context);
  }
});