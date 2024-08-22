import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";
interface Todo {
  //todos task interface
  newId: number; //task new id
  task: string; //task name
  dueDate: string | Date; //task due date
  priority: number; //task priority
  difficulty: number; //task difficulty
  xp: number; //task XP
  isCompleted: boolean; //is task completed for one-time tasks
  repeatEvery: number; //task repeat every
  repeatInterval: number; //task repeat interval
  timesCompleted: number; //number of times the task is completed
  streak: number; //task streak
  rank: number; //task rank
  rankXp: number; //task rank XP
  rankProgress: number; //task rank progress
  originalDueDate: string | Date; //task original due date
}
export default createStore({
  state: {
    /**
     * The task with todos and user state data.
     */
    todos: [] as Todo[],
    user: {
      level: 1 as number, //set level to 1 as total XP is 0 when state is created
      xp: 0 as number, //set xp to 0 when state is created
      progress: 0 as number, //set level progress to 0 percent when state is created
      score: 0 as number, //set score to 0 when state is created
      rating: 0 as number, //set rating to 0 when state is created
      bestScoreEarned: 0 as number, //the highest number of points earned achieved when the task is completed
      dailyStreak: 0 as number, //set daily streak to 0 and last completion date to undefined when state is created
      tasksCompletedToday: 0 as number, //set the number of tasks completed in a day (today) to 0
      totalTasksCompleted: 0 as number, //set the total number of tasks completed to 0
      lastCompletionDate: undefined as string | undefined, //last completion date in YYYY-MM-DD string
    },
  },
  getters: {
    /**
     * Getter methods for tasks with todos and user data.
     */
    getTodos: (state) => state.todos, //get the task list
    getXp: (state) => state.user.xp, //get user XP
    getLevel: (state) => state.user.level, //get user level
    getProgress: (state) => state.user.progress, //get user level progress
    getScore: (state) => state.user.score, //get user score
    getRating: (state) => state.user.rating, //get user rating
    getDailyStreak: (state) => state.user.dailyStreak, //get user daily streak
    getTasksCompletedToday: (state) => state.user.tasksCompletedToday, //get user tasks completed in a day
    getTotalTasksCompleted: (state) => state.user.totalTasksCompleted, //get user total tasks completed
    getLastCompletionDate: (state) => state.user.lastCompletionDate, //get user last completion date
    getBestScoreEarned: (state) => state.user.bestScoreEarned, //get the user best score earned when the task is completed
  },
  mutations: {
    /**
     * Update user XP state when a user presses Complete button to complete the task.
     */
    updateXp: (state, payload) => {
      const task: Todo = state.todos.find(
        (todo: { newId: number }) => todo.newId === payload,
      ) as Todo;
      const daysToDue: number = Math.round(
        (Number(new Date(task.dueDate + " 23:59:59.999")) -
          Number(new Date().setHours(23, 59, 59, 999))) /
          (1000 * 60 * 60 * 24),
      ); //calculate the number of days until the task is due
      let dateMultiplier: number;
      if (daysToDue < 0) {
        //if the task is overdue, XP and score multiplier is less than 1 that decreases over time when the task is overdue
        dateMultiplier = -2 / (daysToDue - 1);
      } else if (daysToDue === 0) {
        //if the task is due today, XP and score multiplier bonus increases more than 2 based on the time the task is completed
        dateMultiplier =
          4 /
          (1 +
            (Number(new Date().setHours(23, 59, 59, 999)) -
              Number(new Date())) /
              (1000 * 24 * 60 * 60));
      } else {
        //else XP and score multiplier bonus increases (more than 1) when the task gets closer to due date
        dateMultiplier = 1 + 1 / (daysToDue + 1);
      }
      let streakMultiplier: number; //calculate task streak XP and score multiplier based on task streak, if the task is completed before the due date, then the streak increases else if the task is completed overdue (after the due date) reset task streak to 0
      let repeatMultiplier: number; //calculate task repetition XP and score multiplier based on task repetition occurrence and task repetition interval
      let dailyStreakMultiplier: number; //calculate daily streak XP and score multiplier based on daily streak
      let levelMultiplier: number; //calculate level score multiplier based on user level
      let dayTasksMultiplier: number; //calculate XP and score multiplier for tasks completed in a day (today)
      let tasksMultiplier: number; //calculate score multiplier for total number of tasks completed
      let rankMultiplier: number; //calculate rank multiplier based on current user rating score
      const activeTasks: number = state.todos.filter(
        (taskList) => !taskList.isCompleted,
      ).length; //calculate the number of active tasks (tasks that are not completed) using Array.filter
      const overdueTasks: number = state.todos.filter(
        (taskList) =>
          new Date(
            new Date(
              new Date().setMinutes(
                new Date().getMinutes() - new Date().getTimezoneOffset(),
              ),
            )
              .toISOString()
              .split("T")[0] + " 23:59:59.999",
          ) >= new Date(taskList.dueDate + " 23:59:59.999"),
      ).length; //calculate the number of overdue tasks (tasks after the due date)
      let activeTasksMultiplier: number; //calculate score multiplier for number of active tasks (tasks that are not completed)
      //calculate task repetition XP multiplier
      if (Number(task.repeatInterval) === 1) {
        //if task repetition interval is daily
        if (task.repeatEvery < 7) {
          //7 days is 1 week
          repeatMultiplier = 1 + (task.repeatEvery - 1) / (7 - 1); //1x XP multiplier for daily tasks (1 day) to 2x XP multiplier for weekly tasks (7 days)
        } else if (task.repeatEvery < 30) {
          //approximately 30 days is 1 month
          repeatMultiplier = 2 + (task.repeatEvery - 7) / (30 - 7); //2x XP multiplier for weekly tasks (7 days) to 3x XP multiplier for monthly tasks (approximately 30 days)
        } else if (task.repeatEvery < 365) {
          //approximately 365 days is 1 year
          repeatMultiplier = 3 + (task.repeatEvery - 30) / (365 - 30); //3x XP multiplier for monthly tasks (approximately 30 days) to 4x XP multiplier for yearly tasks (approximately 365 days)
        } else {
          repeatMultiplier = 5 - 365 / task.repeatEvery; //4x XP multiplier for yearly tasks (approximately 365 days) to 5x XP multiplier for one-time tasks
        }
      } else if (Number(task.repeatInterval) === 2) {
        //if task repetition interval is weekly
        if (task.repeatEvery < 4) {
          //approximately 4 weeks is 1 month
          repeatMultiplier = 2 + (task.repeatEvery - 1) / (4 - 1); //2x XP multiplier for weekly tasks (1 week) to 3x XP multiplier for monthly tasks (approximately 4 weeks)
        } else if (task.repeatEvery < 52) {
          //approximately 52 weeks is 1 year
          repeatMultiplier = 3 + (task.repeatEvery - 4) / (52 - 4); //3x XP multiplier for monthly tasks (approximately 4 weeks) to 4x XP multiplier for yearly tasks (approximately 52 weeks)
        } else {
          repeatMultiplier = 5 - 52 / task.repeatEvery; //4x XP multiplier for yearly tasks (approximately 52 weeks) to 5x XP multiplier for one-time tasks
        }
      } else if (Number(task.repeatInterval) === 3) {
        //if task repetition interval is monthly
        if (task.repeatEvery < 12) {
          //12 months is 1 year
          repeatMultiplier = 3 + (task.repeatEvery - 1) / (12 - 1); //3x XP multiplier for monthly tasks (1 month) to 4x XP multiplier for yearly tasks (12 months)
        } else {
          repeatMultiplier = 5 - 12 / task.repeatEvery; //4x XP multiplier for yearly tasks (12 months) to 5x XP multiplier for one-time tasks
        }
      } else if (Number(task.repeatInterval) === 4) {
        //if task repetition interval is yearly
        repeatMultiplier = 5 - 1 / task.repeatEvery; //4x XP multiplier for yearly tasks (1 year) to 5x XP multiplier for one-time tasks
      } else {
        //if task repetition interval is one-time
        repeatMultiplier = 5; //get 5x XP multiplier for one-time tasks
      }
      //calculate task streak
      if (daysToDue < 0) {
        //if task is overdue
        task.streak = 0; //reset task streak to 0
      } else {
        //if the task is completed before due date (not overdue)
        task.streak++; //increase task streak
      }
      //calculate daily streak
      if (
        state.user.lastCompletionDate === undefined ||
        new Date(new Date().setDate(new Date().getDate() - 1)) >
          new Date(state.user.lastCompletionDate + " 23:59:59.999")
      ) {
        //if user last completion date is before yesterday or undefined (no user task completed yet)
        state.user.dailyStreak = 1; //reset daily streak to 1
      } else if (
        Number(new Date(new Date().setHours(23, 59, 59, 999))) -
          Number(new Date(state.user.lastCompletionDate + " 23:59:59.999")) ===
        1000 * 60 * 60 * 24
      ) {
        //if user last completion date is yesterday
        state.user.dailyStreak++; //increase daily streak
      }
      //calculate the number of tasks completed in a day
      if (
        state.user.lastCompletionDate === undefined ||
        Number(new Date(state.user.lastCompletionDate + " 23:59:59.999")) !==
          Number(new Date(new Date().setHours(23, 59, 59, 999)))
      ) {
        //if new day has passed
        state.user.tasksCompletedToday = 1; //reset tasks completed in a day to 1
      } else {
        state.user.tasksCompletedToday++; //increase tasks completed in a day by 1
      }
      //calculate daily streak XP multiplier
      if (state.user.dailyStreak === 0 || state.user.dailyStreak === 1) {
        dailyStreakMultiplier = 1; //1x daily streak XP multiplier if daily streak is 0 or 1
      } else if (state.user.dailyStreak < 3) {
        dailyStreakMultiplier = 1 + 0.1 * (state.user.dailyStreak - 1); //1x daily streak XP multiplier from 1 daily streak plus 0.1x streak multiplier for each daily streak
      } else if (state.user.dailyStreak < 7) {
        //1 week is 7 days
        dailyStreakMultiplier = 1.2 + 0.05 * (state.user.dailyStreak - 3); //1.2x daily streak XP multiplier from 3 daily streaks plus 0.05x streak multiplier for each daily streak
      } else if (state.user.dailyStreak < 14) {
        //2 weeks are 14 days
        dailyStreakMultiplier = 1.4 + 0.04 * (state.user.dailyStreak - 7); //1.4x daily streak XP multiplier from 7 daily streaks (1 week) plus 0.04x streak multiplier for each daily streak
      } else if (state.user.dailyStreak < 30) {
        //1 month is approximately 30 days
        dailyStreakMultiplier = 1.68 + 0.03 * (state.user.dailyStreak - 14); //1.68x daily streak XP multiplier from 14 daily streaks (2 weeks) plus 0.03x streak multiplier for each daily streak
      } else if (state.user.dailyStreak < 60) {
        //2 months are approximately 60 days
        dailyStreakMultiplier = 2.16 + 0.02 * (state.user.dailyStreak - 30); //2.16x daily streak XP multiplier from 30 daily streaks (approximately 1 month) plus 0.02x streak multiplier for each daily streak
      } else if (state.user.dailyStreak < 90) {
        //3 months are approximately 90 days
        dailyStreakMultiplier = 2.76 + 0.015 * (state.user.dailyStreak - 60); //2.76x daily streak XP multiplier from 60 daily streaks (approximately 2 months) plus 0.015x streak multiplier for each daily streak
      } else if (state.user.dailyStreak < 180) {
        //6 months are approximately 180 days
        dailyStreakMultiplier = 3.21 + 0.01 * (state.user.dailyStreak - 90); //3.21x daily streak XP multiplier from 90 daily streaks (approximately 3 months) plus 0.01x streak multiplier for each daily streak
      } else if (state.user.dailyStreak < 365) {
        //1 year is approximately 365 days
        dailyStreakMultiplier = 4.11 + 0.005 * (state.user.dailyStreak - 180); //4.11x daily streak XP multiplier from 180 daily streaks (approximately 6 months) plus 0.005x streak multiplier for each daily streak
      } else if (state.user.dailyStreak < 730) {
        //2 years are approximately 730 days
        dailyStreakMultiplier = 5.035 + 0.003 * (state.user.dailyStreak - 365); //5.035x daily streak XP multiplier from 365 daily streaks (approximately 1 year) plus 0.003x streak multiplier for each daily streak
      } else if (state.user.dailyStreak < 1461) {
        //4 years are approximately 1,461 days
        dailyStreakMultiplier = 6.13 + 0.002 * (state.user.dailyStreak - 730); //6.13x daily streak XP multiplier from 730 daily streaks (approximately 2 years) plus 0.002x streak multiplier for each daily streak
      } else if (state.user.dailyStreak < 3652) {
        //10 years are approximately 3,652 days
        dailyStreakMultiplier = 7.592 + 0.001 * (state.user.dailyStreak - 1461); //7.592x daily streak XP multiplier from 1,461 daily streaks (approximately 4 years) plus 0.001x streak multiplier for each daily streak
      } else {
        dailyStreakMultiplier = 9.783; //9.783x daily streak XP multiplier from 3,652 daily streaks (approximately 10 years)
      }
      const previousCompletionDate: string | undefined =
        state.user.lastCompletionDate; //set previous completion date to last completion date
      //set the last completion date to today
      state.user.lastCompletionDate = new Date(
        new Date().setMinutes(
          new Date().getMinutes() - new Date().getTimezoneOffset(),
        ),
      )
        .toISOString()
        .split("T")[0];
      const daysSinceLastCompletion: number = Math.round(
        (Number(new Date(state.user.lastCompletionDate + "23:59:59.999")) -
          Number(new Date(previousCompletionDate + "23:59:59.999"))) /
          (1000 * 60 * 60 * 24),
      ); //calculate days since task last completion (inactivity)
      //check if at least 1 day of inactivity
      if (daysSinceLastCompletion >= 1) {
        //repeat for each day of inactivity
        for (let i = 0; i < daysSinceLastCompletion; i++) {
          state.user.rating -= Math.max(
            Math.sqrt(Math.max(state.user.rating, 0)) *
              (1 + Math.log(Math.max(i + 1, 1))) *
              (1 + Math.log(Math.max(overdueTasks + 1, 1))),
            0,
          ); //decrease user rating for each day of inactivity
          state.user.rating = Math.max(state.user.rating, 0); //make sure rating is not below 0
        }
      }
      //calculate task streak XP multiplier
      if (task.streak === 0 || task.streak === 1 || task.repeatInterval === 5) {
        //if task streak is 0 or 1 or task repeat interval is one-time
        streakMultiplier = 1; //1x task streak XP multiplier if task streak is 0 or 1 or completed a one-time task
      } else if (task.streak < 5) {
        streakMultiplier = 1.1 + 0.05 * (task.streak - 1); //1.1x task streak XP multiplier from 1 task streak plus 0.05x streak multiplier for each task streak
      } else if (task.streak < 10) {
        streakMultiplier = 1.3 + 0.04 * (task.streak - 5); //1.3x task streak XP multiplier from 5 task streak plus 0.04x streak multiplier for each task streak
      } else if (task.streak < 20) {
        streakMultiplier = 1.5 + 0.03 * (task.streak - 10); //1.5x task streak XP multiplier from 10 task streak plus 0.03x streak multiplier for each task streak
      } else if (task.streak < 50) {
        streakMultiplier = 1.8 + 0.02 * (task.streak - 20); //1.8x task streak XP multiplier from 20 task streak plus 0.02x streak multiplier for each task streak
      } else if (task.streak < 100) {
        streakMultiplier = 2.4 + 0.01 * (task.streak - 50); //2.4x task streak XP multiplier from 50 task streak plus 0.01x streak multiplier for each task streak
      } else if (task.streak < 200) {
        streakMultiplier = 2.9 + 0.005 * (task.streak - 100); //2.9x task streak XP multiplier from 100 task streak plus 0.005x streak multiplier for each task streak
      } else if (task.streak < 500) {
        streakMultiplier = 3.4 + 0.002 * (task.streak - 200); //3.4x task streak XP multiplier from 200 task streak plus 0.002x streak multiplier for each task streak
      } else if (task.streak < 1000) {
        streakMultiplier = 4 + 0.001 * (task.streak - 500); //4x task streak XP multiplier from 500 task streak plus 0.001x streak multiplier for each task streak
      } else if (task.streak < 2000) {
        streakMultiplier = 4.5 + 0.0005 * (task.streak - 1000); //4.5x task streak XP multiplier from 1,000 task streak plus 0.0005x streak multiplier for each task streak
      } else if (task.streak < 5000) {
        streakMultiplier = 5 + 0.0002 * (task.streak - 2000); //5x task streak XP multiplier from 2,000 task streak plus 0.0002x streak multiplier for each task streak
      } else if (task.streak < 10000) {
        streakMultiplier = 5.6 + 0.0001 * (task.streak - 5000); //5.6x task streak XP multiplier from 5,000 task streak plus 0.0001x streak multiplier for each task streak
      } else {
        streakMultiplier = 6.1; //6.1x task streak XP multiplier from 10,000 task streak
      }
      //calculate multiplier based on tasks completed in a day
      if (
        state.user.tasksCompletedToday === 0 ||
        state.user.tasksCompletedToday === 1
      ) {
        dayTasksMultiplier = 1; //1x multiplier for 0 or 1 tasks completed in a day
      } else if (state.user.tasksCompletedToday < 5) {
        dayTasksMultiplier = 1 + 0.125 * (state.user.tasksCompletedToday - 1); //1x multiplier plus 0.125x multiplier for each task completed in a day from 1 task completed in a day
      } else if (state.user.tasksCompletedToday < 10) {
        dayTasksMultiplier = 1.5 + 0.1 * (state.user.tasksCompletedToday - 5); //1.5x multiplier plus 0.1x multiplier for each task completed in a day from 5 tasks completed in a day
      } else if (state.user.tasksCompletedToday < 20) {
        dayTasksMultiplier = 2 + 0.05 * (state.user.tasksCompletedToday - 10); //2x multiplier plus 0.05x multiplier for each task completed in a day from 10 tasks completed in a day
      } else if (state.user.tasksCompletedToday < 50) {
        dayTasksMultiplier =
          2.5 + 0.025 * (state.user.tasksCompletedToday - 20); //2.5x multiplier plus 0.025x multiplier for each task completed in a day from 20 tasks completed in a day
      } else if (state.user.tasksCompletedToday < 100) {
        dayTasksMultiplier =
          3.25 + 0.02 * (state.user.tasksCompletedToday - 50); //3.25x multiplier plus 0.02x multiplier for each task completed in a day from 50 tasks completed in a day
      } else if (state.user.tasksCompletedToday < 200) {
        dayTasksMultiplier =
          4.25 + 0.01 * (state.user.tasksCompletedToday - 100); //4.25x multiplier plus 0.01x multiplier for each task completed in a day from 100 tasks completed in a day
      } else if (state.user.tasksCompletedToday < 500) {
        dayTasksMultiplier =
          5.25 + 0.005 * (state.user.tasksCompletedToday - 200); //5.25x multiplier plus 0.005x multiplier for each task completed in a day from 200 tasks completed in a day
      } else if (state.user.tasksCompletedToday < 1000) {
        dayTasksMultiplier =
          6.75 + 0.0025 * (state.user.tasksCompletedToday - 500); //6.75x multiplier plus 0.0025x multiplier for each task completed in a day from 500 tasks completed in a day
      } else if (state.user.tasksCompletedToday < 2000) {
        dayTasksMultiplier =
          8 + 0.002 * (state.user.tasksCompletedToday - 1000); //8x multiplier plus 0.002x multiplier for each task completed in a day from 1,000 tasks completed in a day
      } else if (state.user.tasksCompletedToday < 5000) {
        dayTasksMultiplier =
          10 + 0.001 * (state.user.tasksCompletedToday - 2000); //10x multiplier plus 0.001x multiplier for each task completed in a day from 2,000 tasks completed in a day
      } else if (state.user.tasksCompletedToday < 10000) {
        dayTasksMultiplier =
          13 + 0.0006 * (state.user.tasksCompletedToday - 5000); //13x multiplier plus 0.0006x multiplier for each task completed in a day from 5,000 tasks completed in a day
      } else {
        dayTasksMultiplier = 16; //16x multiplier from 10,000 tasks completed in a day
      }
      //calculate level score multiplier based on user level
      if (state.user.level === 0 || state.user.level === 1) {
        levelMultiplier = 1; //1x level score multiplier if user level is 0 or 1
      } else if (state.user.level < 3) {
        levelMultiplier = 1 + 0.1 * (state.user.level - 1); //1x level score multiplier from level 1 plus 0.1x level score multiplier for each level
      } else if (state.user.level < 5) {
        levelMultiplier = 1.2 + 0.05 * (state.user.level - 3); //1.2x level score multiplier from level 3 plus 0.05x level score multiplier for each level
      } else if (state.user.level < 10) {
        levelMultiplier = 1.3 + 0.04 * (state.user.level - 5); //1.3x level score multiplier from level 5 plus 0.04x level score multiplier for each level
      } else if (state.user.level < 20) {
        levelMultiplier = 1.5 + 0.03 * (state.user.level - 10); //1.5x level score multiplier from level 10 plus 0.03x level score multiplier for each level
      } else if (state.user.level < 50) {
        levelMultiplier = 1.8 + 0.02 * (state.user.level - 20); //1.8x level score multiplier from level 20 plus 0.02x level score multiplier for each level
      } else if (state.user.level < 100) {
        levelMultiplier = 2.4 + 0.012 * (state.user.level - 50); //2.4x level score multiplier from level 50 plus 0.012x level score multiplier for each level
      } else if (state.user.level < 200) {
        levelMultiplier = 3 + 0.01 * (state.user.level - 100); //3x level score multiplier from level 100 plus 0.01x level score multiplier for each level
      } else if (state.user.level < 300) {
        levelMultiplier = 4 + 0.005 * (state.user.level - 200); //4x level score multiplier from level 200 plus 0.005x level score multiplier for each level
      } else if (state.user.level < 500) {
        levelMultiplier = 4.5 + 0.0025 * (state.user.level - 300); //4.5x level score multiplier from level 300 plus 0.0025x level score multiplier for each level
      } else if (state.user.level < 1000) {
        levelMultiplier = 5 + 0.002 * (state.user.level - 500); //5x level score multiplier from level 500 plus 0.002x level score multiplier for each level
      } else if (state.user.level < 2000) {
        levelMultiplier = 6 + 0.001 * (state.user.level - 1000); //6x level score multiplier from level 1,000 plus 0.001x level score multiplier for each level
      } else if (state.user.level < 5000) {
        levelMultiplier = 7 + 0.0005 * (state.user.level - 2000); //7x level score multiplier from level 2,000 plus 0.0005x level score multiplier for each level
      } else if (state.user.level < 10000) {
        levelMultiplier = 8.5 + 0.0002 * (state.user.level - 5000); //8.5x level score multiplier from level 5,000 plus 0.0002x level score multiplier for each level
      } else {
        levelMultiplier = 9.5; //9.5 level score multiplier from level 10,000
      }
      state.user.totalTasksCompleted++; //increase total tasks completed by 1
      //calculate task score multiplier
      if (
        state.user.totalTasksCompleted === 0 ||
        state.user.totalTasksCompleted === 1
      ) {
        tasksMultiplier = 1; //1x task score multiplier for 1 task completed
      } else if (state.user.totalTasksCompleted < 3) {
        tasksMultiplier = 1 + 0.1 * (state.user.totalTasksCompleted - 1); //1x task score multiplier from 1 total task completed plus 0.1x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 5) {
        tasksMultiplier = 1.2 + 0.05 * (state.user.totalTasksCompleted - 3); //1.2x task score multiplier from 3 total tasks completed plus 0.05x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 10) {
        tasksMultiplier = 1.3 + 0.04 * (state.user.totalTasksCompleted - 5); //1.3x task score multiplier from 5 total tasks completed plus 0.04x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 20) {
        tasksMultiplier = 1.5 + 0.03 * (state.user.totalTasksCompleted - 10); //1.5x task score multiplier from 10 total tasks completed plus 0.03x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 50) {
        tasksMultiplier = 1.8 + 0.02 * (state.user.totalTasksCompleted - 20); //1.8x task score multiplier from 20 total tasks completed plus 0.02x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 100) {
        tasksMultiplier = 2.4 + 0.012 * (state.user.totalTasksCompleted - 50); //2.4x task score multiplier from 50 total tasks completed plus 0.012x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 200) {
        tasksMultiplier = 3 + 0.01 * (state.user.totalTasksCompleted - 100); //3x task score multiplier from 100 total tasks completed plus 0.01x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 500) {
        tasksMultiplier = 4 + 0.005 * (state.user.totalTasksCompleted - 200); //4x task score multiplier from 200 total tasks completed plus 0.005x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 1000) {
        tasksMultiplier = 5.5 + 0.003 * (state.user.totalTasksCompleted - 500); //5.5x task score multiplier from 500 total tasks completed plus 0.003x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 2000) {
        tasksMultiplier = 7 + 0.002 * (state.user.totalTasksCompleted - 1000); //7x task score multiplier from 1,000 total tasks completed plus 0.002x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 5000) {
        tasksMultiplier = 9 + 0.001 * (state.user.totalTasksCompleted - 2000); //9x task score multiplier from 2,000 total tasks completed plus 0.001x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 10000) {
        tasksMultiplier = 12 + 0.0005 * (state.user.totalTasksCompleted - 5000); //12x task score multiplier from 5,000 total tasks completed plus 0.0005x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 20000) {
        tasksMultiplier =
          14.5 + 0.0003 * (state.user.totalTasksCompleted - 10000); //14.5x task score multiplier from 10,000 total tasks completed plus 0.0003x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 50000) {
        tasksMultiplier =
          17.5 + 0.00025 * (state.user.totalTasksCompleted - 20000); //17.5x task score multiplier from 20,000 total tasks completed plus 0.00025x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 100000) {
        tasksMultiplier =
          25 + 0.0001 * (state.user.totalTasksCompleted - 50000); //25x task score multiplier from 50,000 total tasks completed plus 0.0001x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 200000) {
        tasksMultiplier =
          30 + 0.00006 * (state.user.totalTasksCompleted - 100000); //30x task score multiplier from 100,000 total tasks completed plus 0.00006x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 500000) {
        tasksMultiplier =
          36 + 0.00003 * (state.user.totalTasksCompleted - 200000); //36x task score multiplier from 200,000 total tasks completed plus 0.00003x task score multiplier for each task completed
      } else if (state.user.totalTasksCompleted < 1000000) {
        tasksMultiplier =
          45 + 0.00002 * (state.user.totalTasksCompleted - 500000); //45x task score multiplier from 500,000 total tasks completed plus 0.00002x task score multiplier for each task completed
      } else {
        tasksMultiplier = 55; //55x task score multiplier from 1,000,000 total tasks completed
      }
      //calculate active task score multiplier
      if (activeTasks === 0 || activeTasks === 1) {
        activeTasksMultiplier = 1; //1x active task score multiplier for 0 or 1 active tasks
      } else if (activeTasks < 3) {
        activeTasksMultiplier = 1 + 0.25 * (activeTasks - 1); //1x active task score multiplier from 1 active task plus 0.25x active task score multiplier for each active task
      } else if (activeTasks < 5) {
        activeTasksMultiplier = 1.5 + 0.2 * (activeTasks - 3); //1.5x active task score multiplier from 3 active tasks plus 0.2x active task score multiplier for each active task
      } else if (activeTasks < 10) {
        activeTasksMultiplier = 1.9 + 0.12 * (activeTasks - 5); //1.9x active task score multiplier from 5 active tasks plus 0.12x active task score multiplier for each active task
      } else if (activeTasks < 20) {
        activeTasksMultiplier = 2.5 + 0.05 * (activeTasks - 10); //2.5x active task score multiplier from 10 active tasks plus 0.05x active task score multiplier for each active task
      } else if (activeTasks < 50) {
        activeTasksMultiplier = 3 + 0.03 * (activeTasks - 20); //3x active task score multiplier from 20 active tasks plus 0.03x active task score multiplier for each active task
      } else if (activeTasks < 100) {
        activeTasksMultiplier = 3.9 + 0.022 * (activeTasks - 50); //3.9x active task score multiplier from 50 active tasks plus 0.022x active task score multiplier for each active task
      } else if (activeTasks < 200) {
        activeTasksMultiplier = 5 + 0.015 * (activeTasks - 100); //5x active task score multiplier from 100 active tasks plus 0.015x active task score multiplier for each active task
      } else if (activeTasks < 500) {
        activeTasksMultiplier = 6.5 + 0.01 * (activeTasks - 200); //6.5x active task score multiplier from 200 active tasks plus 0.01x active task score multiplier for each active task
      } else if (activeTasks < 1000) {
        activeTasksMultiplier = 9.5 + 0.005 * (activeTasks - 500); //9.5x active task score multiplier from 500 active tasks plus 0.005x active task score multiplier for each active task
      } else if (activeTasks < 2000) {
        activeTasksMultiplier = 12 + 0.004 * (activeTasks - 1000); //12x active task score multiplier from 1,000 active tasks plus 0.004x active task score multiplier for each active task
      } else if (activeTasks < 5000) {
        activeTasksMultiplier = 16 + 0.002 * (activeTasks - 2000); //16x active task score multiplier from 2,000 active tasks plus 0.002x active task score multiplier for each active task
      } else if (activeTasks < 10000) {
        activeTasksMultiplier = 22 + 0.001 * (activeTasks - 5000); //22x active task score multiplier from 5,000 active tasks plus 0.001x active task score multiplier for each active task
      } else {
        activeTasksMultiplier = 27; //27x active task score multiplier from 10,000 active tasks
      }
      //calculate rank multiplier bonus based on user rating score
      if (state.user.rating < 10) {
        rankMultiplier = 0; //0 rank multiplier for rating under 10
      } else if (state.user.rating < 50) {
        rankMultiplier = 1; //1 rank multiplier for rating from 10 to under 50
      } else if (state.user.rating < 100) {
        rankMultiplier = 2; //2 rank multiplier for rating from 50 to under 100
      } else if (state.user.rating < 250) {
        rankMultiplier = 3; //3 rank multiplier for rating from 100 to under 250
      } else if (state.user.rating < 500) {
        rankMultiplier = 4; //4 rank multiplier for rating from 250 to under 500
      } else if (state.user.rating < 1000) {
        rankMultiplier = 5; //5 rank multiplier for rating from 500 to under 1,000
      } else if (state.user.rating < 2000) {
        rankMultiplier = 6; //6 rank multiplier for rating from 1,000 to under 2,000
      } else if (state.user.rating < 3000) {
        rankMultiplier = 7; //7 rank multiplier for rating from 2,000 to under 3,000
      } else if (state.user.rating < 5000) {
        rankMultiplier = 8; //8 rank multiplier for rating from 3,000 to under 5,000
      } else if (state.user.rating < 7500) {
        rankMultiplier = 9; //9 rank multiplier for rating from 5,000 to under 7,500
      } else if (state.user.rating < 10000) {
        rankMultiplier = 10; //10 rank multiplier for rating from 7,500 to under 10,000
      } else if (state.user.rating < 15000) {
        rankMultiplier = 11; //11 rank multiplier for rating from 10,000 to under 15,000
      } else if (state.user.rating < 20000) {
        rankMultiplier = 12; //12 rank multiplier for rating from 15,000 to under 20,000
      } else if (state.user.rating < 25000) {
        rankMultiplier = 13; //13 rank multiplier for rating from 20,000 to under 25,000
      } else if (state.user.rating < 30000) {
        rankMultiplier = 14; //14 rank multiplier for rating from 25,000 to under 30,000
      } else if (state.user.rating < 40000) {
        rankMultiplier = 15; //15 rank multiplier for rating from 30,000 to under 40,000
      } else if (state.user.rating < 50000) {
        rankMultiplier = 16; //16 rank multiplier for rating from 40,000 to under 50,000
      } else if (state.user.rating < 60000) {
        rankMultiplier = 17; //17 rank multiplier for rating from 50,000 to under 60,000
      } else if (state.user.rating < 75000) {
        rankMultiplier = 18; //18 rank multiplier for rating from 60,000 to under 75,000
      } else if (state.user.rating < 100000) {
        rankMultiplier = 19; //19 rank multiplier for rating from 75,000 to under 100,000
      } else if (state.user.rating < 125000) {
        rankMultiplier = 20; //20 rank multiplier for rating from 100,000 to under 125,000
      } else if (state.user.rating < 150000) {
        rankMultiplier = 21; //21 rank multiplier for rating from 125,000 to under 150,000
      } else if (state.user.rating < 200000) {
        rankMultiplier = 22; //22 rank multiplier for rating from 150,000 to under 200,000
      } else if (state.user.rating < 250000) {
        rankMultiplier = 23; //23 rank multiplier for rating from 200,000 to under 250,000
      } else if (state.user.rating < 300000) {
        rankMultiplier = 24; //24 rank multiplier for rating from 250,000 to under 300,000
      } else if (state.user.rating < 400000) {
        rankMultiplier = 25; //25 rank multiplier for rating from 300,000 to under 400,000
      } else if (state.user.rating < 500000) {
        rankMultiplier = 26; //26 rank multiplier for rating from 400,000 to under 500,000
      } else if (state.user.rating < 600000) {
        rankMultiplier = 27; //27 rank multiplier for rating from 500,000 to under 600,000
      } else if (state.user.rating < 750000) {
        rankMultiplier = 28; //28 rank multiplier for rating from 600,000 to under 750,000
      } else if (state.user.rating < 1000000) {
        rankMultiplier = 29; //29 rank multiplier for rating from 750,000 to under 1,000,000
      } else if (state.user.rating < 1250000) {
        rankMultiplier = 30; //30 rank multiplier for rating from 1,000,000 to under 1,250,000
      } else if (state.user.rating < 1500000) {
        rankMultiplier = 31; //31 rank multiplier for rating from 1,250,000 to under 1,500,000
      } else if (state.user.rating < 2000000) {
        rankMultiplier = 32; //32 rank multiplier for rating from 1,500,000 to under 2,000,000
      } else if (state.user.rating < 2500000) {
        rankMultiplier = 33; //33 rank multiplier for rating from 2,000,000 to under 2,500,000
      } else if (state.user.rating < 3000000) {
        rankMultiplier = 34; //34 rank multiplier for rating from 2,500,000 to under 3,000,000
      } else if (state.user.rating < 4000000) {
        rankMultiplier = 35; //35 rank multiplier for rating from 3,000,000 to under 4,000,000
      } else if (state.user.rating < 5000000) {
        rankMultiplier = 36; //36 rank multiplier for rating from 4,000,000 to under 5,000,000
      } else if (state.user.rating < 6000000) {
        rankMultiplier = 37; //37 rank multiplier for rating from 5,000,000 to under 6,000,000
      } else if (state.user.rating < 8000000) {
        rankMultiplier = 38; //38 rank multiplier for rating from 6,000,000 to under 8,000,000
      } else if (state.user.rating < 10000000) {
        rankMultiplier = 39; //39 rank multiplier for rating from 8,000,000 to under 10,000,000
      } else if (state.user.rating < 12500000) {
        rankMultiplier = 40; //40 rank multiplier for rating from 10,000,000 to under 12,500,000
      } else if (state.user.rating < 15000000) {
        rankMultiplier = 41; //41 rank multiplier for rating from 12,500,000 to under 15,000,000
      } else if (state.user.rating < 17500000) {
        rankMultiplier = 42; //42 rank multiplier for rating from 15,000,000 to under 17,500,000
      } else if (state.user.rating < 20000000) {
        rankMultiplier = 43; //43 rank multiplier for rating from 17,500,000 to under 20,000,000
      } else if (state.user.rating < 25000000) {
        rankMultiplier = 44; //44 rank multiplier for rating from 20,000,000 to under 25,000,000
      } else if (state.user.rating < 30000000) {
        rankMultiplier = 45; //45 rank multiplier for rating from 25,000,000 to under 30,000,000
      } else if (state.user.rating < 35000000) {
        rankMultiplier = 46; //46 rank multiplier for rating from 30,000,000 to under 35,000,000
      } else if (state.user.rating < 40000000) {
        rankMultiplier = 47; //47 rank multiplier for rating from 35,000,000 to under 40,000,000
      } else if (state.user.rating < 45000000) {
        rankMultiplier = 48; //48 rank multiplier for rating from 40,000,000 to under 45,000,000
      } else if (state.user.rating < 50000000) {
        rankMultiplier = 49; //49 rank multiplier for rating from 45,000,000 to under 50,000,000
      } else if (state.user.rating < 60000000) {
        rankMultiplier = 50; //50 rank multiplier for rating from 50,000,000 to under 60,000,000
      } else if (state.user.rating < 70000000) {
        rankMultiplier = 51; //51 rank multiplier for rating from 60,000,000 to under 70,000,000
      } else if (state.user.rating < 80000000) {
        rankMultiplier = 52; //52 rank multiplier for rating from 70,000,000 to under 80,000,000
      } else if (state.user.rating < 90000000) {
        rankMultiplier = 53; //53 rank multiplier for rating from 80,000,000 to under 90,000,000
      } else if (state.user.rating < 100000000) {
        rankMultiplier = 54; //54 rank multiplier for rating from 90,000,000 to under 100,000,000
      } else if (state.user.rating < 125000000) {
        rankMultiplier = 55; //55 rank multiplier for rating from 100,000,000 to under 125,000,000
      } else if (state.user.rating < 150000000) {
        rankMultiplier = 56; //56 rank multiplier for rating from 125,000,000 to under 150,000,000
      } else if (state.user.rating < 175000000) {
        rankMultiplier = 57; //57 rank multiplier for rating from 150,000,000 to under 17,500,000
      } else if (state.user.rating < 200000000) {
        rankMultiplier = 58; //58 rank multiplier for rating from 175,000,000 to under 200,000,000
      } else if (state.user.rating < 225000000) {
        rankMultiplier = 59; //59 rank multiplier for rating from 200,000,000 to under 225,000,000
      } else if (state.user.rating < 250000000) {
        rankMultiplier = 60; //60 rank multiplier for rating from 225,000,000 to under 250,000,000
      } else if (state.user.rating < 300000000) {
        rankMultiplier = 61; //61 rank multiplier for rating from 250,000,000 to under 300,000,000
      } else if (state.user.rating < 350000000) {
        rankMultiplier = 62; //62 rank multiplier for rating from 300,000,000 to under 350,000,000
      } else if (state.user.rating < 400000000) {
        rankMultiplier = 63; //63 rank multiplier for rating from 350,000,000 to under 400,000,000
      } else if (state.user.rating < 450000000) {
        rankMultiplier = 64; //64 rank multiplier for rating from 400,000,000 to under 450,000,000
      } else if (state.user.rating < 500000000) {
        rankMultiplier = 65; //65 rank multiplier for rating from 450,000,000 to under 500,000,000
      } else if (state.user.rating < 600000000) {
        rankMultiplier = 66; //66 rank multiplier for rating from 500,000,000 to under 600,000,000
      } else if (state.user.rating < 700000000) {
        rankMultiplier = 67; //67 rank multiplier for rating from 600,000,000 to under 700,000,000
      } else if (state.user.rating < 800000000) {
        rankMultiplier = 68; //68 rank multiplier for rating from 700,000,000 to under 800,000,000
      } else if (state.user.rating < 900000000) {
        rankMultiplier = 69; //69 rank multiplier for rating from 800,000,000 to under 900,000,000
      } else if (state.user.rating < 1000000000) {
        rankMultiplier = 70; //70 rank multiplier for rating from 900,000,000 to under 1,000,000,000
      } else {
        rankMultiplier = 71; //71 rank multiplier for rating from 1,000,000,000
      }
      //calculate the amount of XP earned and points earned when the task is completed
      const rankXpEarned: number = Math.max(
        Math.floor(
          (dateMultiplier - 1) ** 2 *
            100 *
            Math.max(task.rank, 1) *
            Math.max(task.streak, 1) *
            repeatMultiplier *
            (1 + rankMultiplier / 10),
        ),
        1,
      ); //get at least 1 rank XP when the task is completed
      task.rankXp += rankXpEarned; //increase rank XP based on task due date, task streak and task rank
      const rankLevel: number = Math.max(
        Math.floor(Math.pow((task.rankXp + 0.5) / 100, 1 / 4)),
        1,
      ); //update rank level
      task.rank = rankLevel; //set task rank level
      task.rankProgress =
        ((task.rankXp / 100 - Math.pow(task.rank === 1 ? 0 : task.rank, 4)) /
          (Math.pow(task.rank + 1, 3) -
            Math.pow(task.rank === 1 ? 0 : task.rank, 4))) *
        100; //calculate rank level progress and if level is 1 set rank level at the start of level 1 to 0 XP
      const xpEarned: number = Math.max(
        Math.floor(
          task.difficulty *
            task.priority *
            dateMultiplier *
            repeatMultiplier *
            streakMultiplier *
            dailyStreakMultiplier *
            dayTasksMultiplier *
            (1 + task.rank / 10) *
            (1 + rankMultiplier / 10),
        ),
        1,
      ); //get at least 1 XP when the task is completed
      state.user.xp += xpEarned; //get the amount of XP earned based on task difficulty, task priority, task due date, task repetition, task streak, daily streak and task rank multipliers
      state.user.rating += Math.max(
        (10 + Math.log(Math.max(state.user.rating + 100, 100)) ** 2) *
          repeatMultiplier *
          dateMultiplier <
          1
          ? 1 - dateMultiplier
          : (dateMultiplier - 1) / Math.max(state.user.tasksCompletedToday, 1),
        0,
      ); //get the amount of rating poings earned based on user rating, task repeat multiplier and number of tasks completed today
      state.user.rating = Math.max(state.user.rating, 0); //make sure user rating is not below 0
      const pointsEarned: number = Math.max(
        Math.floor(
          task.difficulty *
            task.priority *
            dateMultiplier *
            repeatMultiplier *
            streakMultiplier *
            dailyStreakMultiplier *
            dayTasksMultiplier *
            levelMultiplier *
            tasksMultiplier *
            activeTasksMultiplier *
            (1 + task.rank / 10) *
            (1 + rankMultiplier / 10),
        ),
        1,
      ); //get at least 1 point when the task is completed
      state.user.score += pointsEarned; //get amount of points earned based on task difficulty, task priority, task due date, task repetition, task streak, daily streak, user level and rank multipliers
      if (pointsEarned > state.user.bestScoreEarned) {
        //if points earned are greater than the best score earned
        state.user.bestScoreEarned = pointsEarned; //set the best score earned to points earned when the task is completed
      }
      alert(
        `Task ${task.task} completed!\nYou earned ${xpEarned.toLocaleString("en-US")} XP!\nYou earned ${pointsEarned.toLocaleString("en-US")} point${pointsEarned === 1 ? "" : "s"}!`,
      ); //alert user to show how many XP they earned and points earned after completing the task
      //check if user has leveled up
      const userLevel: number = state.user.level; //set userLevel variable before calculating user level state
      state.user.level = Math.max(
        1,
        Math.floor(Math.cbrt(state.user.xp + 0.5)),
      ); //calculate level based on how many XP and set level to 1 if total XP is 0
      if (state.user.level > userLevel) {
        alert(
          `Level Up!\nYou are now level ${state.user.level.toLocaleString("en-US")}!`,
        ); //alert user when user levels up
      }
      state.user.progress =
        ((state.user.xp -
          Math.pow(state.user.level === 1 ? 0 : state.user.level, 3)) /
          (Math.pow(state.user.level + 1, 3) -
            Math.pow(state.user.level === 1 ? 0 : state.user.level, 3))) *
        100; //calculate level progress and if level is 1 set total XP at the start of level 1 to 0 XP
    },
    create_Todo: (state, payload) => {
      /**
       * Create the task when a user presses the Add Task button.
       */
      const createTask = {
        newId: payload.newId as number,
        task: payload.task as string,
        dueDate: payload.dueDate as Date,
        priority: payload.priority as number,
        difficulty: payload.difficulty as number,
        xp: payload.xp as number,
        isCompleted: payload.isCompleted as boolean,
        repeatEvery: payload.repeatEvery as number,
        repeatInterval: payload.repeatInterval as number,
        timesCompleted: payload.timesCompleted as number,
        streak: payload.streak as number,
        rank: payload.rank as number,
        rankXp: payload.rankXp as number,
        rankProgress: payload.rankProgress as number,
        originalDueDate: payload.originalDueDate as Date,
      };
      state.todos.unshift(createTask);
    },
    complete_Todo: (state, payload) => {
      /**
       * Complete the task when user presses the Complete button.
       */
      const item: Todo = state.todos.find(
        (todo: { newId: number }) => todo.newId === payload,
      ) as Todo;
      if (Number(item.repeatInterval) === 5) {
        //if the task is a one-time only
        item.isCompleted = !item.isCompleted; //complete task item (set completed task to true)
      } else {
        item.timesCompleted++; //increment number of times tasks has been completed by 1
        if (Number(item.repeatInterval) === 1) {
          //if task repeat interval is daily
          const newDueDate: Date = new Date(
            new Date(item.originalDueDate + " 23:59:59.999").setDate(
              new Date(item.originalDueDate + " 23:59:59.999").getDate() +
                item.timesCompleted * item.repeatEvery,
            ),
          ); //get a new due date
          const adjustedNewDueDate: Date = new Date(
            newDueDate.setMinutes(
              newDueDate.getMinutes() - newDueDate.getTimezoneOffset(),
            ),
          ); //convert to local timezone
          item.dueDate = adjustedNewDueDate.toISOString().split("T")[0]; //convert due date to YYYY-MM-DD string
        } else if (Number(item.repeatInterval) === 2) {
          //if task repeat interval is weekly
          const newDueDate: Date = new Date(
            new Date(item.originalDueDate + " 23:59:59.999").setDate(
              new Date(item.originalDueDate + " 23:59:59.999").getDate() +
                item.timesCompleted * item.repeatEvery * 7,
            ),
          );
          const adjustedNewDueDate: Date = new Date(
            newDueDate.setMinutes(
              newDueDate.getMinutes() - newDueDate.getTimezoneOffset(),
            ),
          );
          item.dueDate = adjustedNewDueDate.toISOString().split("T")[0];
        } else if (Number(item.repeatInterval) === 3) {
          //if task repeat interval is monthly
          const monthsAfter: Date = new Date(
            new Date(item.originalDueDate + " 23:59:59.999").setMonth(
              new Date(item.originalDueDate + " 23:59:59.999").getMonth() +
                item.timesCompleted * item.repeatEvery,
            ),
          );
          if (
            monthsAfter.getMonth() !==
            (new Date(item.originalDueDate + " 23:59:59.999").getMonth() +
              item.timesCompleted * item.repeatEvery) %
              12
          ) {
            //if task due date is more than days of the month, set to last day of month
            const newDueDate: Date = new Date(
              new Date(item.originalDueDate + " 23:59:59.999").getFullYear(),
              new Date(item.originalDueDate + " 23:59:59.999").getMonth() +
                item.timesCompleted * item.repeatEvery +
                1,
              0,
              23,
              59,
              59,
              999,
            );
            const adjustedNewDueDate: Date = new Date(
              newDueDate.setMinutes(
                newDueDate.getMinutes() - newDueDate.getTimezoneOffset(),
              ),
            );
            item.dueDate = adjustedNewDueDate.toISOString().split("T")[0];
          } else {
            const newDueDate: Date = new Date(
              new Date(item.originalDueDate + " 23:59:59.999").getFullYear(),
              new Date(item.originalDueDate + " 23:59:59.999").getMonth() +
                item.timesCompleted * item.repeatEvery,
              new Date(item.originalDueDate + " 23:59:59.999").getDate(),
              23,
              59,
              59,
              999,
            );
            const adjustedNewDueDate: Date = new Date(
              newDueDate.setMinutes(
                newDueDate.getMinutes() - newDueDate.getTimezoneOffset(),
              ),
            );
            item.dueDate = adjustedNewDueDate.toISOString().split("T")[0];
          }
        } else if (Number(item.repeatInterval) === 4) {
          //if task repeat interval is yearly
          const yearsAfter: Date = new Date(
            new Date(item.originalDueDate + " 23:59:59.999").setFullYear(
              new Date(item.originalDueDate + " 23:59:59.999").getFullYear() +
                item.timesCompleted * item.repeatEvery,
            ),
          );
          if (
            yearsAfter.getMonth() !==
            new Date(item.originalDueDate + " 23:59:59.999").getMonth()
          ) {
            //if task due date don't have leap year, set task due date to February 28
            const newDueDate: Date = new Date(
              new Date(item.originalDueDate + " 23:59:59.999").getFullYear() +
                item.timesCompleted * item.repeatEvery,
              new Date(item.originalDueDate + " 23:59:59.999").getMonth() + 1,
              0,
              23,
              59,
              59,
              999,
            );
            const adjustedNewDueDate: Date = new Date(
              newDueDate.setMinutes(
                newDueDate.getMinutes() - newDueDate.getTimezoneOffset(),
              ),
            );
            item.dueDate = adjustedNewDueDate.toISOString().split("T")[0];
          } else {
            const newDueDate: Date = new Date(
              new Date(item.originalDueDate + " 23:59:59.999").getFullYear() +
                item.timesCompleted * item.repeatEvery,
              new Date(item.originalDueDate + " 23:59:59.999").getMonth(),
              new Date(item.originalDueDate + " 23:59:59.999").getDate(),
              23,
              59,
              59,
              999,
            );
            const adjustedNewDueDate: Date = new Date(
              newDueDate.setMinutes(
                newDueDate.getMinutes() - newDueDate.getTimezoneOffset(),
              ),
            );
            item.dueDate = adjustedNewDueDate.toISOString().split("T")[0];
          }
        }
      }
    },
    delete_Todo: (state, payload) => {
      /**
       * Delete the task when a user confirms task deletion alert after pressing the Delete button.
       */
      const index = state.todos.findIndex(
        (todo: { newId: number }) => todo.newId === payload,
      );
      let deleteTask;
      if (!state.todos[index].isCompleted) {
        //don't ask for confirmation when one-time task is completed
        deleteTask = confirm(
          `Do you want to delete the task ${state.todos[index].task}?\nThis action cannot be undone.`,
        ) as boolean; //ask user to confirm task deletion
      }
      if (deleteTask || state.todos[index].isCompleted) {
        //delete task if one-time task is completed when the deleted button is clicked or when user confirms deletion alert
        state.todos.splice(index, 1); //delete task item
      }
    },
    setUser: (state, user) => {
      /**
       * Sets the user data.
       */
      state.user = user; //set user data
    },
    setTodos: (state, todos) => {
      /**
       * Sets the todos (tasks) data.
       */
      state.todos = todos; //set todos (tasks) data
    },
  },
  actions: {
    createTask: (context, payload) => {
      /**
       * Action to create the task.
       */
      context.commit("create_Todo", payload);
    },
    completeTask: (context, payload) => {
      /**
       * Action to complete the task.
       */
      context.commit("updateXp", payload);
      context.commit("complete_Todo", payload);
    },
    deleteTask: (context, payload) => {
      /**
       * Action to delete the task.
       */
      context.commit("delete_Todo", payload);
    },
    saveUser(context, user) {
      /**
       * Action to save user data to local storage.
       * @param user the user data
       */
      localStorage.setItem("user", JSON.stringify(user)); //save user data
      context.commit("setUser", user);
    },
    loadUser(context) {
      /**
       * Action to load user data from local storage.
       */
      const user = JSON.parse(localStorage.getItem("user") as string); //load user data
      if (user) {
        context.commit("setUser", user);
      }
    },
    saveTodos(context, todos) {
      /**
       * Action to save task list data to local storage.
       * @param todos the task list data
       */
      localStorage.setItem("todos", JSON.stringify(todos)); //save task list data as JSON
      context.commit("setTodos", todos);
    },
    loadTodos(context) {
      /**
       * Action to load task list data to local storage.
       */
      const todos = JSON.parse(localStorage.getItem("todos") as string); //load task list data by parsing JSON string
      if (todos) {
        context.commit("setTodos", todos);
      }
    },
  },
  modules: {},
  plugins: [createPersistedState()], //create persisted state and save the data to local storage
});
