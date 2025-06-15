<template>
    <form @submit.prevent="addTask">
        <!--all fields are required in order to add a task-->
        Name:<br /><!--task name can be up to 255 characters in length-->
        <input
            class="task-input"
            id="name"
            type="text"
            placeholder="Enter task name"
            maxlength="255"
            v-model="task"
            required
        /><br />
        Due date:<br /><!--task due date must be on or after today's date-->
        <input
            class="task-input"
            id="due-date"
            type="date"
            placeholder="Enter due date"
            v-model="originalDueDate"
            required
        /><br />
        Priority:<br />
        <select class="task-input" id="priority" v-model="priority" required>
            <option value="1">Low</option>
            <option value="2">Medium</option>
            <option value="3">High</option></select
        ><br />
        Difficulty:<br />
        <select
            class="task-input"
            id="difficulty"
            v-model="difficulty"
            required
        >
            <option value="1">Easy</option>
            <option value="2">Medium</option>
            <option value="3">Hard</option></select
        ><br />
        Repeat every:<br />
        <input
            class="task-input"
            id="repeat-every"
            type="number"
            placeholder="Enter number of days/weeks/months/years to repeat"
            v-model="repeatEvery"
            required
            min="1"
            step="1"
        /><br />
        Repeat interval:<br />
        <select
            class="task-input"
            id="repeat-interval"
            v-model="repeatInterval"
            required
        >
            <option value="1">Daily</option>
            <option value="2">Weekly</option>
            <option value="3">Monthly</option>
            <option value="4">Yearly</option>
            <option value="5">Once</option></select
        ><br />
        <button type="submit">Add Task</button>
    </form>
</template>

<script lang="ts">
import store from "@/store";
import { Difficulty, Priority, RepeatInterval } from "./TaskList.vue";
import { defineComponent } from "vue";

export interface TodoTask {
    //todo task list interface
    task: string; //task name
    dueDate: Date; //task due date
    priority: number; //task priority
    difficulty: number; //task difficulty
    repeatEvery: number; //task repetition number of days/weeks/months/years
    repeatInterval: number; //task repetition interval
    newId: number; //task id
    isCompleted: boolean; //task completed or not
    timesCompleted: number; //number of times tasks has been completed
    streak: number; //task completion streak
    originalDueDate: Date; //task original due date in YYYY-MM-DD string
}
const currentUtcDate: Date = new Date(); //current UTC date
const currentLocalDate: Date = new Date(
    currentUtcDate.setMinutes(
        currentUtcDate.getMinutes() - currentUtcDate.getTimezoneOffset(),
    ),
); //current date in local time zone

export default defineComponent({
    //define the component to default values when the task is created
    data() {
        return {
            task: "",
            dueDate: currentLocalDate.toISOString().split("T")[0], //set the default due date to today
            priority: Priority.Low, //set the default priority is low
            difficulty: Difficulty.Easy, //set the default difficulty is easy
            repeatEvery: 1, //set the default task repetition number to 1
            repeatInterval: RepeatInterval?.Once, //set the default task repetition interval to one-time
            newId: 0, //initial task id is 0
            isCompleted: false, //task not completed if a task is created
            timesCompleted: 0, //set the default task times completed to 0
            streak: 0, //set the default task streak to 0
            rank: 1, //set the default task rank to 1
            rankXp: 0, //set the default task rank XP to 0
            rankProgress: 0, //set the default rank progress to 0
            originalDueDate: currentLocalDate.toISOString().split("T")[0], //set the default original task due date to today
        };
    },
    mounted() {
        const dueDateInput = document.getElementById(
            "due-date",
        ) as HTMLInputElement; //get due date value as input element
        dueDateInput.min = currentLocalDate.toISOString().split("T")[0]; //task minimum due date must be today
    },
    methods: {
        /**
         * Add the task to the task list when the user presses the Add Task button.
         */
        addTask: function (): void | TodoTask[] {
            this.dueDate = this.originalDueDate; //set the task due date to entered task original due date
            store.dispatch("createTask", this); //create the task to the user store
            this.newId++;
            this.task = "";
            this.dueDate = currentLocalDate.toISOString().split("T")[0];
            this.priority = Priority.Low;
            this.difficulty = Difficulty.Easy;
            this.repeatEvery = 1;
            this.repeatInterval = RepeatInterval.Once;
            this.isCompleted = false;
            this.timesCompleted = 0;
            this.streak = 0;
            this.rank = 1;
            this.rankXp = 0;
            this.rankProgress = 0;
            this.originalDueDate = currentLocalDate.toISOString().split("T")[0];
        },
    },
});
</script>

<style lang="scss">
form {
    line-height: 150%;
}
button {
    margin: 10px;
}
</style>
