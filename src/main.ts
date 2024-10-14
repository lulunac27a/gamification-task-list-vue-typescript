import { createApp, h } from "vue";
import App from "./App.vue";
import store from "./store";
import veProgress from "vue-ellipse-progress";

createApp({ render: () => h(App) })
  .use(store)
  .use(veProgress)
  .mount("#app");
/* eslint-disable */
store.dispatch("loadUser").then(
  (success) => {//if user data is loaded successfully
    console.log("User data loaded successfully!");
  },
  (error) => {//if user data is not loaded successfully (failed to load)
    console.log("User data failed to load.");
  }
); //load user data
store.dispatch("loadTasks").then(
  (success) => {//if task list data is loaded successfully
    console.log("Task list data loaded successfully!");
  },
  (error) => {//if task list data is not loaded successfully (failed to load)
    console.log("Task list data failed to load.");
  }
); //load task list data
/* eslint-enable */