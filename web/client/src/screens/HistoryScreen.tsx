import { useEffect, useMemo, useState } from 'react';
import { Download, Play, Trash2 } from 'lucide-react';
import type { GeneratedTrackRecord } from '@shared/types';
import { ScreenShell } from '../components/ScreenShell';
import { deleteGeneratedTrack, listGeneratedTracks } from '../lib/historyDb';
import { downloadBlob } from '../lib/fileName';

type HistoryScreenProps = {
  onBack: () => void;
};

export function HistoryScreen({ onBack }: HistoryScreenProps) {
  const [records, setRecords] = useState<GeneratedTrackRecord[]>([]);
  const [selected, setSelected] = useState<GeneratedTrackRecord>();
  const selectedUrl = useMemo(() => selected ? URL.createObjectURL(selected.wavBlob) : '', [selected]);

  const reload = async () => {
    setRecords(await listGeneratedTracks());
  };

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    return () => {
      if (selectedUrl) {
        URL.revokeObjectURL(selectedUrl);
      }
    };
  }, [selectedUrl]);

  const remove = async (id: string) => {
    await deleteGeneratedTrack(id);
    if (selected?.id === id) {
      setSelected(undefined);
    }
    await reload();
  };

  return (
    <ScreenShell background="/assets/texture/assets/result_background.png" fit="cover" dim>
      <section className="history-screen">
        <header>
          <div>
            <p>ブラウザに保存された歌声</p>
            <h1>生成履歴</h1>
          </div>
          <button onClick={onBack}>タイトルへ</button>
        </header>

        {records.length === 0 ? (
          <div className="empty-history">
            <p>まだ保存された歌声がありません。</p>
          </div>
        ) : (
          <div className="history-grid">
            <div className="history-list">
              {records.map((record) => (
                <article key={record.id} className={selected?.id === record.id ? 'selected-history' : ''}>
                  <button className="history-main" onClick={() => setSelected(record)}>
                    <strong>{record.songTitle}</strong>
                    <span>{new Date(record.createdAt).toLocaleString('ja-JP')}</span>
                    <small>{record.fileName}</small>
                  </button>
                  <div className="history-actions">
                    <button onClick={() => setSelected(record)} aria-label="再生"><Play size={18} /></button>
                    <button onClick={() => downloadBlob(record.wavBlob, record.fileName)} aria-label="ダウンロード"><Download size={18} /></button>
                    <button onClick={() => void remove(record.id)} aria-label="削除"><Trash2 size={18} /></button>
                  </div>
                </article>
              ))}
            </div>

            <aside className="history-detail">
              {selected ? (
                <>
                  <h2>{selected.songTitle}</h2>
                  <audio src={selectedUrl} controls />
                  <pre>{selected.lyrics}</pre>
                  <button onClick={() => downloadBlob(selected.wavBlob, selected.fileName)}>WAVをダウンロード</button>
                </>
              ) : (
                <p>履歴を選ぶと歌詞と再生プレイヤーが表示されます。</p>
              )}
            </aside>
          </div>
        )}
      </section>
    </ScreenShell>
  );
}
