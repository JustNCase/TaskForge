type TaskCardProps = {
  title: string;
  status: string;
};

export default function TaskCard({ title, status }: TaskCardProps) {
  return (
    <div>
      <h3>{title}</h3>
      <p>Status: {status}</p>
    </div>
  );
}
