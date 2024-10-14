<template>
  <div class="task-list-app">
    <!--task list app content-->
    <p>
      Level:
      <span id="text-numeric-display">{{
        getCurrentLevel.toLocaleString("en-US")
      }}</span>
    </p>
    <p>
      XP:
      <span id="text-numeric-display">{{
        getCurrentXp.toLocaleString("en-US")
      }}</span>
    </p>
    <p>
      Daily Streak:
      <span id="text-numeric-display">{{
        getCurrentDailyStreak.toLocaleString("en-US")
      }}</span>
    </p>
    <p>
      Tasks Completed Today:
      <span id="text-numeric-display">{{
        getCurrentTasksCompletedToday.toLocaleString("en-US")
      }}</span>
    </p>
    <p>
      Total Tasks Completed:
      <span id="text-numeric-display">{{
        getCurrentTotalTasksCompleted.toLocaleString("en-US")
      }}</span>
    </p>
    <p>
      Score:
      <span id="text-numeric-display">{{
        getCurrentScore.toLocaleString("en-US")
      }}</span>
    </p>
    <p>
      Best Points Earned After Completing the Task:
      <span id="text-numeric-display">{{
        getCurrentBestScoreEarned.toLocaleString("en-US")
      }}</span>
    </p>
    <p>
      Rating:
      <span id="text-numeric-display">{{
        getCurrentRating.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      }}</span>
    </p>
    <!--show the circular progress bar filled with level progress--><ve-progress
      :progress="getCurrentProgress"
      >Level
      <span id="text-numeric-display">{{
        getCurrentLevel.toLocaleString("en-US")
      }}</span></ve-progress
    >
    <h3>Task list</h3>
    <ul class="tasks">
      <!--repeat for each tasks-->
      <li v-for="task in getTasks" :key="task.newId" class="task">
        <span
          :class="{
            overdue: new Date(task.dueDate + ' 23:59:59.999') < new Date(),
          }"
          ><span id="text-numeric-display"
            >{{ task.task
            }}<span
              v-if="new Date(task.dueDate + ' 23:59:59.999') < new Date()"
            >
              (Overdue)</span
            ></span
          >
          <br />Streak:
          <span id="text-numeric-display">{{
            task.streak.toLocaleString("en-US")
          }}</span>
          <br />Rank:
          <span id="text-numeric-display">{{
            task.rank.toLocaleString("en-US")
          }}</span>
          <br /><progress max="100" :value="task.rankProgress"></progress
          ><br />Due date:
          <span id="text-numeric-display">{{ task.dueDate }}</span>
          <br />Priority:
          <span id="text-numeric-display">{{ task.priority }}</span>
          <br />Difficulty:
          <span id="text-numeric-display">{{ task.difficulty }}</span>
          <br />Repeat:
          <span v-if="task.repeatInterval != 5"
            ><span id="text-numeric-display">{{
              task.repeatEvery.toLocaleString("en-US")
            }}</span></span
          >&nbsp;<span v-if="task.repeatInterval == 1">Day</span
          ><span v-if="task.repeatInterval == 2">Week</span
          ><span v-if="task.repeatInterval == 3">Month</span
          ><span v-if="task.repeatInterval == 4">Year</span
          ><span v-if="task.repeatInterval == 5">Once</span
          ><span v-if="task.repeatEvery > 1 && task.repeatInterval != 5"
            >s</span
          ></span
        >
        <!--don't show the complete button if one-time task is completed--><button
          v-if="!task.isCompleted"
          @click="completeTask(task.newId)"
        >
          Complete
        </button>
        <button @click="deleteTask(task.newId)">Delete</button><br />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { defineComponent } from "vue";
import { TodoTask } from "./NewTask.vue";

export enum RepeatInterval {
  Daily = 1, //daily gets 1x XP, weekly gets 2x XP, monthly gets 3x XP, yearly gets 4x XP, one-time gets 5x XP multiplier
  Weekly = 2,
  Monthly = 3,
  Yearly = 4,
  Once = 5,
}
export enum Difficulty {
  Easy = 1, //easy gets 1x XP, medium gets 2x XP, hard gets 3x XP multiplier
  Medium = 2,
  Hard = 3,
}
export enum Priority {
  Low = 1, //low gets 1x XP, medium gets 2x XP, hard gets 3x XP multiplier
  Medium = 2,
  High = 3,
}
export default defineComponent({
  name: "TaskList",
  props: {
    newId: Number,
    tasks: Array,
    title: String,
    dueDate: Date,
    priority: Number,
    difficulty: Number,
    repeatInterval: String,
    repeatEvery: Number,
    level: Number,
    xp: Number,
    isCompleted: Boolean,
    timesCompleted: Number,
    streak: Number,
    dailyStreak: Number,
    rank: Number,
    rankXp: Number,
    rankProgress: Number,
    originalDueDate: Date,
  },
  computed: {
    getTasks() {
      return store.getters.getTasks.sort(
        (a: TodoTask, b: TodoTask) =>
          Number(new Date(a.dueDate + " 23:59:59.999")) -
          Number(new Date(b.dueDate + " 23:59:59.999")),
      ); //get list of tasks (todos) and sort tasks by task's due date with the top one the oldest
    },
    getCurrentLevel() {
      return store.getters.getLevel; //get current level
    },
    getCurrentXp() {
      return store.getters.getXp; //get current XP
    },
    getCurrentProgress() {
      return store.getters.getProgress; //get current progress
    },
    getCurrentScore() {
      return store.getters.getScore; //get current score
    },
    getCurrentRating() {
      return store.getters.getRating; //get current rating
    },
    getCurrentDailyStreak() {
      return store.getters.getDailyStreak; //get current daily streak
    },
    getCurrentTasksCompletedToday() {
      return store.getters.getTasksCompletedToday; //get tasks completed in a day (today)
    },
    getCurrentTotalTasksCompleted() {
      return store.getters.getTotalTasksCompleted; //get total tasks completed
    },
    getCurrentLastCompletedDate() {
      return store.getters.getLastCompletionDate; //get the current last completion date
    },
    getCurrentBestScoreEarned() {
      return store.getters.getBestScoreEarned; //get best score earned
    },
  },
  methods: {
    /**
     * Complete the task based on task ID.
     * @param id the task ID
     */
    completeTask: function (id: number): void {
      store.dispatch("completeTask", id);
    },
    /**
     * Delete the task based on task ID.
     * @param id the task ID
     */
    deleteTask: function (id: number): void {
      store.dispatch("deleteTask", id);
    },
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<link scoped lang="scss" src="./TaskList.scss" />
