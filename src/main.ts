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
    (success) => {
        //if the user data is loaded successfully
        console.log("User data loaded successfully!");
    },
    (error) => {
        //if the user data is not loaded successfully (failed to load)
        console.log("User data failed to load.");
    },
); //load the user data
store.dispatch("loadTasks").then(
    (success) => {
        //if the task list data is loaded successfully
        console.log("Task list data loaded successfully!");
    },
    (error) => {
        //if the task list data is not loaded successfully (failed to load)
        console.log("Task list data failed to load.");
    },
); //load the task list data
/* eslint-enable */
