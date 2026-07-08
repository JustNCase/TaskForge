type Task = {
  id: string;
  title: string;
  status: string;
};

type TaskListProps = {
  tasks: Task[];
};

export default function TaskList({ tasks }: TaskListProps) {
  return (
    <div>
      <h2>Your Tasks</h2>
      {tasks.map((task) => (
        <div key={task.id}>
          <strong>{task.title}</strong>
          <span> - {task.status}</span>
        </div>
      ))}
    </div>
  );
}
