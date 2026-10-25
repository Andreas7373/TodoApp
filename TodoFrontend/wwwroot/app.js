const isLocalDev = ["5214", "5090"].includes(location.port);
const taskApi = isLocalDev ? "http://localhost:5029" : "";
const statsApi = isLocalDev ? "http://localhost:5089" : "";

async function loadTasks() {
    const container = document.getElementById("tasks");

    try {
        const response = await fetch(`${taskApi}/api/tasks`);

        if (!response.ok)
            throw new Error("Failed to load tasks");

        const tasks = await response.json();

        container.replaceChildren();

        for (const task of tasks) {
            const row = document.createElement("div");
            row.className = "task-row";

            const title = document.createElement("span");
            title.textContent = task.title;

            if (task.isCompleted) {
                title.style.textDecoration = "line-through";
                title.style.color = "gray";
            }

            const button = document.createElement("button");
            button.textContent = task.isCompleted
                ? "Completed"
                : "Complete";

            button.disabled = task.isCompleted;

            button.addEventListener("click", () =>
                completeTask(task.id));

            row.append(title, button);
            container.appendChild(row);
        }

    } catch (error) {
        container.textContent = error.message;
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${statsApi}/api/stats`);

        if (!response.ok)
            throw new Error("Failed to load statistics");

        const stats = await response.json();

        document.getElementById("totalTasks").textContent =
            stats.totalTasks;

        document.getElementById("completedTasks").textContent =
            stats.completedTasks;

        document.getElementById("pendingTasks").textContent =
            stats.pendingTasks;

    } catch (error) {
        alert(error.message);
    }
}

document.getElementById("taskForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const title = document.getElementById("taskTitle").value;

        try {
            const response = await fetch(`${taskApi}/api/tasks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: title,
                    isCompleted: false
                })
            });

            if (!response.ok) {
                throw new Error("Failed to create task");
            }

            document.getElementById("message").textContent =
                "Task created!";

            document.getElementById("taskForm").reset();

            await loadTasks();
            await loadStats();

        } catch (error) {
            document.getElementById("message").textContent =
                error.message;
        }
    });

async function completeTask(id) {
    try {
        const response = await fetch(
            `${taskApi}/api/tasks/${id}/complete`,
            {
                method: "PUT"
            }
        );

        if (!response.ok)
            throw new Error("Failed to complete task");

        await loadTasks();
        await loadStats();

    } catch (error) {
        alert(error.message);
    }
}

loadTasks();
loadStats();