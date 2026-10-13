import { useState } from 'react';
import type { RoomView } from '../../../shared/types.ts';
import StoryForm from './StoryForm.tsx';
import { totalPoints } from './StoryQueue.tsx';

interface Props {
  view: RoomView;
  isFacilitator: boolean;
  onAdd: (title: string, description: string) => Promise<boolean>;
}

export default function StorySummary({ view, isFacilitator, onAdd }: Props) {
  const [adding, setAdding] = useState(false);
  return (
    <section className="panel summary" aria-labelledby="summary-title">
      <h2 id="summary-title">Hepsi tamam! 🎉</h2>
      <table className="summary-table">
        <thead>
          <tr>
            <th scope="col">Story</th>
            <th scope="col">Puan</th>
          </tr>
        </thead>
        <tbody>
          {view.stories.map((s) => (
            <tr key={s.id}>
              <td>{s.title}</td>
              <td>{s.points}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Toplam: {totalPoints(view.stories)} puan</th>
            <td />
          </tr>
        </tfoot>
      </table>
      {isFacilitator &&
        (adding ? (
          <StoryForm submitLabel="Ekle" onSubmit={onAdd} onCancel={() => setAdding(false)} />
        ) : (
          <button type="button" className="btn btn-secondary" onClick={() => setAdding(true)}>
            Yeni story ekle
          </button>
        ))}
    </section>
  );
}
