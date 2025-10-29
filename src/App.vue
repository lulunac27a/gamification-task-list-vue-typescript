<template>
    <img alt="Vue logo" src="./assets/logo.png" />
    <div>
        <h1>Task List Application using Vue, TypeScript and Vuex</h1>
        <p>
            This is a task list application using Vue, TypeScript, and Vuex with
            SCSS styles. It supports gamification like levels and experience
            points (XP). It uses Vuex to store user data to the storage.
        </p>
        <NewTask />
        <TaskList />
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import NewTask from "./components/NewTask.vue";
import TaskList from "./components/TaskList.vue";

export default defineComponent({
    name: "App",
    components: {
        NewTask,
        TaskList,
    },
});
</script>

<link rel="stylesheet" lang="scss" src="./App.scss" />
