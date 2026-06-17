# include "VocalSynthesis.hpp"

namespace
{
	Optional<FilePath> ResolveInstPath(const String& baseName)
	{
		if (baseName == U"ハッピーバースデー")
		{
			const FilePath happyBirthDayResourcePath = Resource(U"Inst/HappyBirthday.wav");

			if (FileSystem::Exists(happyBirthDayResourcePath))
			{
				return happyBirthDayResourcePath;
			}
		}

		const Array<FilePath> candidates =
		{
			Resource(U"Score/" + baseName + U".wav"),
			Resource(U"Score/" + baseName + U".mp3"),
			U"Inst/" + baseName + U".wav",
			U"Inst/" + baseName + U".mp3",
		};

		for (const auto& path : candidates)
		{
			if (FileSystem::Exists(path))
			{
				return path;
			}
		}

		return none;
	}
}

VocalSynthesis::VocalSynthesis(const InitData& init)
	: IScene{ init }
{
	// GIFに関する処理
	// 各フレームの画像と、次のフレームへのディレイ（ミリ秒）をロードする
	gif.read(images, delays);

	// 各フレームの Image から Texure を作成する
	textures = images.map([](const Image& image) { return Texture{ image }; });

	// 画像データはもう使わないため、消去してメモリ消費を減らす
	images.clear();

	m_timer.start(); // タイマー開始

	const JSON originalVV = JSON::Load(getData().vvprojPath);
	const String base = FileSystem::BaseName(getData().vvprojPath);
	m_baseName = base;
	const String singerName = U"ずんだもん";
	getData().SingingNames << singerName;
	const int i = 0; // ずんだもん1人のときのインデックス
	getData().songTrackName = VOICEVOX::GetVVProjTrackName(getData().vvprojPath, i);
	const int32 normalSpkID = 3003; // ずんだもん（ノーマル）
	const int32 namiDameSpkID = 3076; // ずんだもん（なみだめ）

	// 歌詞差し替えした vvproj を作って保存
	JSON parodyVV = VOICEVOX::ApplyParodyLyrics(
		originalVV,
		getData().solvedTasks
	);

	// 一時vvproj
	FilePath vvTmp = U"tmp/tmp_modified_" + base + U"_track" + Format(i + 1) + U".vvproj";
	if (!parodyVV.save(vvTmp))
	{
		Console << U"一時vvprojの保存に失敗しました: " << vvTmp;
	}

	// ③ スコアJSONへの変換は、元vvprojではなくvvTmpを使う
	FilePath score = U"tmp/tmp_" + base + U"_track" + Format(i + 1) + U".json";
	if (!VOICEVOX::ConvertVVProjToScoreJSON(vvTmp, score, i))
	{
		Console << U"スコアJSONへの変換に失敗しました: " << score;
	}

	FilePath songwav = U"Voice/" + base + U"-ずんだもん（ノーマル）_track" + Format(i + 1) + U".wav";

	int keyShift = VOICEVOX::GetKeyAdjustment(U"ずんだもん", U"ノーマル");

	// あとで再生に使うため、パスを記録しておく
	m_songWavPath = songwav;
	m_scorePath = score;
	m_baseName = base;

	// 非同期タスクとして合成を実行
	m_isLoading = true;
	m_timer.restart();

	Array<bool> onomatopoeiaLineCorrects;
	if (base == U"オノマトペ")
	{
		for (const auto& task : getData().solvedTasks)
		{
			if (task.restPadding
				&& task.syllables.size() == 6
				&& !task.syllables.isEmpty()
				&& task.syllables.front() == U"ル")
			{
				onomatopoeiaLineCorrects << task.isCorrect;
			}
		}
	}

	m_task = Async([=]()
		{
			if (base == U"オノマトペ")
			{
				return VOICEVOX::SynthesizeOnomatopoeiaScoreByLine(
					score,
					songwav,
					onomatopoeiaLineCorrects,
					normalSpkID,
					namiDameSpkID,
					getData().baseURL,
					keyShift);
			}

			return VOICEVOX::SynthesizeFromJSONFileWrapperSplit(score, songwav, normalSpkID, getData().baseURL, 2500, keyShift);
		});
}

void VocalSynthesis::update()
{
	// 非同期処理が終わったか？
	if (m_isLoading && m_task.isReady())
	{
		const bool success = m_task.get(); // 結果を取得
		m_isLoading = false;

		if (success)
		{
			// 音声と伴奏をロード
			Audio songAudio{ m_songWavPath, Loop::Yes };
			FileSystem::Remove(m_scorePath);
			Audio inst;

			if (const auto instPath = ResolveInstPath(m_baseName))
			{
				inst = Audio{ *instPath, Loop::Yes };
			}
			else
			{
				Console << U"伴奏ファイルが見つかりません: "
					<< Resource(U"Score/" + m_baseName + U".wav") << U" / "
					<< Resource(U"Score/" + m_baseName + U".mp3") << U" / "
					<< U"Inst/" + m_baseName + U".wav" << U" / "
					<< U"Inst/" + m_baseName + U".mp3";
			}

			//Console << U"「" + m_baseName + U"」の再生準備が完了しました。";

			// 共有データへ保存
			getData().charCount = 1;
			getData().SingerNames = { U"ずんだもん" };
			getData().StyleNames = { U"ノーマル" };
			getData().songAudio = { songAudio };
			getData().instAudio = inst;
			getData().vvprojPath = getData().vvprojPath;
			getData().songTitle = FileSystem::BaseName(getData().vvprojPath);
			getData().readyToPlay = true;
		}

		//Console << U"音声合成が完了しました";
		changeScene(U"Result", 0.1s);
	}
}

void VocalSynthesis::draw() const
{
	// GIFアニメーションの描画
	ClearPrint();

	// フレーム数

	//Print << textures.size() << U" frames";

	// 各フレームのディレイ（ミリ秒）一覧
	//Print << U"delays: " << delays;

	// アニメーションの経過時間
	double t = Scene::Time();

	// 経過時間と各フレームのディレイに基づいて、何番目のフレームを描けばよいかを計算する
	size_t frameIndex = AnimatedGIFReader::GetFrameIndex(t, delays);

	// 現在のフレーム番号
	//Print << U"frameIndex: " << frameIndex;

	textures[frameIndex].drawAt(Scene::Center());

	m_font(U"ずんだもん が おうた を\n\nれんしゅう しているよ").drawAt(60, Scene::Center().x, Scene::Center().y - 200, kogetyaColor);
}
