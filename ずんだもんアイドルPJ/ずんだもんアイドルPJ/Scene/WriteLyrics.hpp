# include "../Common.hpp"
# include "../VOICEVOX/VOICEVOX.hpp"

//------------------------------------------------------
// WriteLyrics : 歌詞を書くシーン
//------------------------------------------------------
class WriteLyrics : public App::Scene
{
public:
	WriteLyrics(const InitData& init);

	void update() override;
	void draw() const override;

private:
	mutable TextEditState m_textState;
	String m_message;
	Vec2 m_debugPos; // デバッグ文字の位置
	Texture frame{ Resource(U"Texture/assets/game_frame.png") };
	Texture background{ Resource(U"Texture/assets/result_background.png") };
	Array<String> splitSyllables(const String& text) const;
	Array<String> talkLines;
	Array<VOICEVOX::TalkProblem> m_problems;
	size_t m_problemCount = 0;
	size_t currentIndex = 0; // 現在のお題番号

	char getVowel(const String& syllable) const; // 母音取得ヘルパー関数
	bool isHiraganaOnly(const String& text) const; // ひらがなフィルタ関数
	String replaceChoonWithVowel(const String& text) const; // 長音記号置換関数
	int32 decideQuestionFontSize(const String& questionText) const;
	String makeQuestionDisplayText(size_t index, const String& questionText) const;

	const FilePath fontPath = Resource(U"Texture/Futehodo-MaruGothic.ttf");
	Font m_font{ FontMethod::MSDF, 180, fontPath };
	Font result_font{ FontMethod::MSDF, 22, fontPath };
	String m_currentTopic; // 現在表示中のお題テキスト

	Stopwatch m_timer;   // カウントダウン用タイマー
	const int32 m_timeLimit = 60; // 各お題の制限時間（秒）

	// GIF アニメーション画像を開く
	const AnimatedGIFReader gif{ Resource(U"Texture/assets/game_background2.gif") };
	Array<Image> images;
	mutable Array<int32> delays;
	Array<Texture> textures;

	Color kogetyaColor{ 134, 79, 9 };

	Stopwatch m_countdownTimer;   // カウントダウン用タイマー
	bool m_showCountdown = true;  // カウントダウン中フラグ
	double m_countdownDuration = 5.0; // カウントダウン時間（秒）

	String m_errorMessage; // 入力エラー表示用メッセージ
};
