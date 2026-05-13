#include "WriteLyrics.hpp"

// WriteLyrics::WriteLyrics (コンストラクタ)
WriteLyrics::WriteLyrics(const InitData& init)
	: IScene{ init }, m_textState{}
{
	m_textState.active = true;
	m_isVerbQuizSong = (getData().songTitle == U"動詞グループ");
	if (m_isVerbQuizSong)
	{
		loadVerbDictionary();
	}

	talkLines = VOICEVOX::ExtractTalkUtterances(getData().vvprojPath);
	m_problems = VOICEVOX::BuildTalkProblems(talkLines);
	m_problemCount = m_problems.size();

	if (!m_problems.isEmpty())
	{
		currentIndex = 0;
		m_currentTopic = m_problems[currentIndex].questionText;
		getData().solvedTasks.clear();
		getData().finalRhymeMatchPercent = 0.0; // スコア機能は無効化
		prepareQuizChoices();
	}
	else
	{
		m_currentTopic = U"お題がありません";
	}

	// GIFに関する処理
	// 各フレームの画像と、次のフレームへのディレイ（ミリ秒）をロードする
	gif.read(images, delays);

	// 各フレームの Image から Texure を作成する
	textures = images.map([](const Image& image) { return Texture{ image }; });

	// 画像データはもう使わないため、消去してメモリ消費を減らす
	images.clear();

	m_timer.start(); // タイマー開始

	m_countdownTimer.start();  // カウントダウン開始
	m_showCountdown = true;    // カウントダウンモードON
}

// WriteLyrics::splitSyllables (音節分割関数)
Array<String> WriteLyrics::splitSyllables(const String& text) const
{
	const String smallKanaList = U"ゃゅょぁぃぅぇぉっャュョァィゥェォッ";
	Array<String> result;

	for (size_t i = 0; i < text.length(); ++i)
	{
		String s;
		s += text[i];

		if ((i + 1 < text.length()) && smallKanaList.includes(text[i + 1]))
		{
			s += text[i + 1];
			++i;
		}
		result << s;
	}
	return result;
}

// WriteLyrics::getVowel (母音取得ヘルパー関数)
char WriteLyrics::getVowel(const String& syllable) const
{
	// 拗音（きゃ、しゅ、てょなど）は最後の母音、撥音/促音は N/Q
	if (syllable == U"ん" || syllable == U"ン") return 'N'; // 撥音
	if (syllable == U"っ" || syllable == U"ッ") return 'Q'; // 促音

	// 小文字（ゃゅょぁぃぅぇぉ）は splitSyllables で前の文字に結合されている前提

	// 結合されている場合、最後の文字が母音を決定する
	// 例: きゃ の 'ゃ' の母音は 'a'
	const String lastChar = syllable.substr(syllable.length() - 1);

	if (lastChar == U"あ" || lastChar == U"か" || lastChar == U"さ" || lastChar == U"た" || lastChar == U"な" || lastChar == U"は" || lastChar == U"ま" || lastChar == U"や" || lastChar == U"ら" || lastChar == U"わ" || lastChar == U"が" || lastChar == U"ざ" || lastChar == U"だ" || lastChar == U"ば" || lastChar == U"ぱ" || lastChar == U"ぁ" || lastChar == U"ゃ") return 'a';
	if (lastChar == U"い" || lastChar == U"き" || lastChar == U"し" || lastChar == U"ち" || lastChar == U"に" || lastChar == U"ひ" || lastChar == U"み" || lastChar == U"り" || lastChar == U"ゐ" || lastChar == U"ぎ" || lastChar == U"じ" || lastChar == U"ぢ" || lastChar == U"び" || lastChar == U"ぴ" || lastChar == U"ぃ") return 'i';
	if (lastChar == U"う" || lastChar == U"く" || lastChar == U"す" || lastChar == U"つ" || lastChar == U"ぬ" || lastChar == U"ふ" || lastChar == U"む" || lastChar == U"ゆ" || lastChar == U"る" || lastChar == U"ぐ" || lastChar == U"ず" || lastChar == U"づ" || lastChar == U"ぶ" || lastChar == U"ぷ" || lastChar == U"ぅ" || lastChar == U"ゅ") return 'u';
	if (lastChar == U"え" || lastChar == U"け" || lastChar == U"せ" || lastChar == U"て" || lastChar == U"ね" || lastChar == U"へ" || lastChar == U"め" || lastChar == U"れ" || lastChar == U"ゑ" || lastChar == U"げ" || lastChar == U"ぜ" || lastChar == U"で" || lastChar == U"べ" || lastChar == U"ぺ" || lastChar == U"ぇ") return 'e';
	if (lastChar == U"お" || lastChar == U"こ" || lastChar == U"そ" || lastChar == U"と" || lastChar == U"の" || lastChar == U"ほ" || lastChar == U"も" || lastChar == U"よ" || lastChar == U"ろ" || lastChar == U"を" || lastChar == U"ご" || lastChar == U"ぞ" || lastChar == U"ど" || lastChar == U"ぼ" || lastChar == U"ぽ" || lastChar == U"ぉ" || lastChar == U"ょ") return 'o';
	if (lastChar == U"ア" || lastChar == U"カ" || lastChar == U"サ" || lastChar == U"タ" || lastChar == U"ナ" || lastChar == U"ハ" || lastChar == U"マ" || lastChar == U"ヤ" || lastChar == U"ラ" || lastChar == U"ワ" || lastChar == U"ガ" || lastChar == U"ザ" || lastChar == U"ダ" || lastChar == U"バ" || lastChar == U"パ" || lastChar == U"ァ" || lastChar == U"ャ") return 'a';
	if (lastChar == U"イ" || lastChar == U"キ" || lastChar == U"シ" || lastChar == U"チ" || lastChar == U"ニ" || lastChar == U"ヒ" || lastChar == U"ミ" || lastChar == U"リ" || lastChar == U"ヰ" || lastChar == U"ギ" || lastChar == U"ジ" || lastChar == U"ヂ" || lastChar == U"ビ" || lastChar == U"ピ" || lastChar == U"ィ") return 'i';
	if (lastChar == U"ウ" || lastChar == U"ク" || lastChar == U"ス" || lastChar == U"ツ" || lastChar == U"ヌ" || lastChar == U"フ" || lastChar == U"ム" || lastChar == U"ユ" || lastChar == U"ル" || lastChar == U"グ" || lastChar == U"ズ" || lastChar == U"ヅ" || lastChar == U"ブ" || lastChar == U"プ" || lastChar == U"ゥ" || lastChar == U"ュ") return 'u';
	if (lastChar == U"エ" || lastChar == U"ケ" || lastChar == U"セ" || lastChar == U"テ" || lastChar == U"ネ" || lastChar == U"ヘ" || lastChar == U"メ" || lastChar == U"レ" || lastChar == U"ヱ" || lastChar == U"ゲ" || lastChar == U"ゼ" || lastChar == U"デ" || lastChar == U"ベ" || lastChar == U"ペ" || lastChar == U"ェ") return 'e';
	if (lastChar == U"オ" || lastChar == U"コ" || lastChar == U"ソ" || lastChar == U"ト" || lastChar == U"ノ" || lastChar == U"ホ" || lastChar == U"モ" || lastChar == U"ヨ" || lastChar == U"ロ" || lastChar == U"ヲ" || lastChar == U"ゴ" || lastChar == U"ゾ" || lastChar == U"ド" || lastChar == U"ボ" || lastChar == U"ポ" || lastChar == U"ォ" || lastChar == U"ョ") return 'o';

	// ひらがな・カタカナ以外の文字（漢字や句読点など）が入ってきた場合のデフォルト
	return 'X'; // 不明な母音として扱う
}

bool WriteLyrics::isHiraganaOnly(const String& text) const
{
	for (const auto& ch : text)
	{
		if (!((U'ぁ' <= ch && ch <= U'ん') || ch == U'ー'))
		{
			return false; // ひらがな以外が含まれている
		}
	}
	return true;
}

// 「ー」を直前の母音（あいうえお）に変換
String WriteLyrics::replaceChoonWithVowel(const String& text) const
{
	String result;

	for (size_t i = 0; i < text.size(); ++i)
	{
		const char32 ch = text[i];

		if (ch == U'ー' && !result.isEmpty())
		{
			const char vowel = getVowel(String(1, result.back()));

			switch (vowel)
			{
			case 'a': result += U"ア"; break;
			case 'i': result += U"イ"; break;
			case 'u': result += U"ウ"; break;
			case 'e': result += U"エ"; break;
			case 'o': result += U"オ"; break;
			case 'N': result += U"ん"; break;
			case 'Q': result += U"っ"; break;
			default:  result += U"ら"; break; // 不明時はそのまま
			}
		}
		else
		{
			result += ch;
		}
	}

	return result;
}

int32 WriteLyrics::decideQuestionFontSize(const String& questionText) const
{
	const size_t len = questionText.size();
	if (len <= 8)
	{
		return 100;
	}
	if (len <= 10)
	{
		return 90;
	}
	return 80;
}

String WriteLyrics::makeQuestionDisplayText(size_t index, const String& questionText) const
{
	static const Array<String> kCircledNumbers = {
		U"①", U"②", U"③", U"④", U"⑤", U"⑥", U"⑦", U"⑧", U"⑨", U"⑩",
		U"⑪", U"⑫", U"⑬", U"⑭", U"⑮", U"⑯", U"⑰", U"⑱", U"⑲", U"⑳"
	};

	if (index < kCircledNumbers.size())
	{
		return kCircledNumbers[index] + U" " + questionText;
	}
	return U"{} {}"_fmt(index + 1, questionText);
}

void WriteLyrics::loadVerbDictionary()
{
	const Array<FilePath> candidates = {
		Resource(U"Dict/Verb.csv"),
		U"Dict/Verb.csv",
		U"App/Dict/Verb.csv",
		U"ずんだもんアイドルPJ/App/Dict/Verb.csv",
		U"ずんだもんアイドルPJ/ずんだもんアイドルPJ/App/Dict/Verb.csv"
	};

	Optional<FilePath> dictPath;
	for (const auto& path : candidates)
	{
		if (FileSystem::Exists(path))
		{
			dictPath = path;
			break;
		}
	}

	if (!dictPath)
	{
		Console << U"[WriteLyrics] 動詞辞書が見つかりません: Dict/Verb.csv";
		return;
	}

	TextReader reader{ *dictPath };
	if (!reader)
	{
		Console << U"[WriteLyrics] 動詞辞書を開けません: " << *dictPath;
		return;
	}

	String line;
	while (reader.readLine(line))
	{
		const Array<String> fields = line.split(U',');
		if (fields.size() < 5)
		{
			continue;
		}

		const String word = fields[1].trimmed();
		const String reading = fields[2].trimmed();
		const String group = fields[4].trimmed();

		if (!word.isEmpty() && !reading.isEmpty() && group.includes(U"動詞"))
		{
			m_verbEntries << VerbEntry{ word, reading, group };
		}
	}
}

Optional<String> WriteLyrics::parseQuestionVerbGroup(const String& questionText) const
{
	if (questionText.includes(U"Ⅰ") || questionText.includes(U"1") || questionText.includes(U"一"))
	{
		return U"動詞1類";
	}
	if (questionText.includes(U"Ⅱ") || questionText.includes(U"2") || questionText.includes(U"二"))
	{
		return U"動詞2類";
	}
	if (questionText.includes(U"Ⅲ") || questionText.includes(U"3") || questionText.includes(U"三"))
	{
		return U"動詞3類";
	}
	return none;
}

Array<WriteLyrics::VerbEntry> WriteLyrics::findVerbEntries(const String& group, size_t maxSyllables, bool sameGroup) const
{
	Array<VerbEntry> entries;
	const size_t moraLimit = Min<size_t>(maxSyllables, 4);

	for (const auto& entry : m_verbEntries)
	{
		if ((entry.group == group) != sameGroup)
		{
			continue;
		}

		const size_t syllableCount = splitSyllables(replaceChoonWithVowel(entry.reading)).size();
		if (2 <= syllableCount && syllableCount <= moraLimit)
		{
			entries << entry;
		}
	}

	return entries;
}

void WriteLyrics::prepareQuizChoices()
{
	m_quizMode = false;
	m_quizOptions.clear();
	m_correctOptionIndex = 0;

	if (!m_isVerbQuizSong)
	{
		return;
	}

	if (currentIndex >= m_problemCount)
	{
		return;
	}

	if (m_verbEntries.isEmpty())
	{
		m_errorMessage = U"動詞辞書を読み込めませんでした";
		return;
	}

	const auto& problem = m_problems[currentIndex];
	const Optional<String> targetGroup = parseQuestionVerbGroup(problem.questionText);
	if (!targetGroup)
	{
		return;
	}

	const size_t maxSyllables = Max<size_t>(2, problem.maxSyllableCount);
	Array<VerbEntry> correctEntries = findVerbEntries(*targetGroup, maxSyllables, true);
	Array<VerbEntry> wrongEntries = findVerbEntries(*targetGroup, maxSyllables, false);

	if (correctEntries.isEmpty() || wrongEntries.size() < 2)
	{
		m_errorMessage = U"動詞辞書の選択肢が足りません";
		return;
	}

	Shuffle(correctEntries);
	Shuffle(wrongEntries);

	const VerbEntry correct = correctEntries.front();
	m_quizOptions << correct;
	m_quizOptions << wrongEntries[0];
	m_quizOptions << wrongEntries[1];
	Shuffle(m_quizOptions);

	for (size_t i = 0; i < m_quizOptions.size(); ++i)
	{
		if (m_quizOptions[i].word == correct.word
			&& m_quizOptions[i].reading == correct.reading
			&& m_quizOptions[i].group == correct.group)
		{
			m_correctOptionIndex = i;
			break;
		}
	}

	m_quizMode = true;
}

void WriteLyrics::submitAnswer(const String& displayText, const String& readingText)
{
	if (currentIndex >= m_problemCount)
	{
		return;
	}

	const auto& problem = m_problems[currentIndex];
	const size_t maxSyllables = Max<size_t>(2, problem.maxSyllableCount);
	const String normalizedText = replaceChoonWithVowel(readingText);

	Array<String> finalSyllables = splitSyllables(normalizedText);
	String finalText = normalizedText;
	const size_t s = finalSyllables.size();

	if (s < 2 || s > maxSyllables)
	{
		m_errorMessage = U"選択した言葉の音節数が合いません";
		return;
	}

	auto vowelToKana = [](char v)->String
		{
			switch (v)
			{
			case 'a': return U"あ";
			case 'i': return U"い";
			case 'u': return U"う";
			case 'e': return U"え";
			case 'o': return U"お";
			case 'N': return U"ん";
			case 'Q': return U"っ";
			default:  return U"あ";
			}
		};

	if (s < maxSyllables)
	{
		const size_t remainingSlots = (maxSyllables - s);
		const Array<String> particleSyllables = splitSyllables(problem.particleText);
		const bool canAppendParticle =
			(!problem.particleText.isEmpty())
			&& (!particleSyllables.isEmpty())
			&& (particleSyllables.size() <= remainingSlots);

		const char v = getVowel(finalSyllables.back());
		const String vowelKana = vowelToKana(v);

		auto appendVowelFills = [&](size_t fillCount)
			{
				for (size_t i = 0; i < fillCount; ++i)
				{
					finalText += vowelKana;
					finalSyllables << vowelKana;
				}
			};

		if (canAppendParticle)
		{
			const size_t needVowelFill = remainingSlots - particleSyllables.size();
			appendVowelFills(needVowelFill);
			finalText += problem.particleText;
			for (const auto& syl : particleSyllables)
			{
				finalSyllables << syl;
			}
		}
		else
		{
			appendVowelFills(remainingSlots);
		}
	}

	getData().solvedTasks << SolvedTask{
		.phrase = problem.baseTargetText,
		.syllables = problem.targetSyllables,
		.userInput = displayText,
		.userSyllables = finalSyllables,
		.score = 0.0,
		.rhymeMatchPercent = 0.0,
		.matchesCount = 0
	};

	m_errorMessage.clear();
	++currentIndex;
	m_timer.restart();

	if (currentIndex < m_problemCount)
	{
		m_currentTopic = m_problems[currentIndex].questionText;
		prepareQuizChoices();
	}
	else
	{
		getData().fullLyrics = VOICEVOX::BuildResultDisplayLyrics(
			getData().vvprojPath,
			getData().solvedTasks
		);
		getData().finalRhymeMatchPercent = 0.0;
		changeScene(U"VocalSynthesis", 0.3s);
	}

	m_textState.text.clear();
	m_textState.active = true;
}

void WriteLyrics::update()
{
	// 全体集計 + 遷移（韻スコアは使わない）
	auto finalizeAndExit = [&]()
		{
			getData().fullLyrics = VOICEVOX::BuildResultDisplayLyrics(
				getData().vvprojPath,
				getData().solvedTasks
			);

			// スコア機能は無効なので 0 固定
			getData().finalRhymeMatchPercent = 0.0;

			changeScene(U"VocalSynthesis", 0.3s);
		};

	if (m_showCountdown)
	{
		double elapsed = m_countdownTimer.s();

		if (elapsed >= m_countdownDuration)
		{
			// カウントダウン終了
			m_showCountdown = false;
			m_timer.restart(); // ゲームタイマー開始
		}

		return; // カウントダウン中は何もしない
	}

	if (m_problems.isEmpty())
	{
		Print << U"お題がありません。";
		return;
	}

	if (currentIndex >= m_problemCount)
	{
		finalizeAndExit();
		return;
	}

	const auto& problem = m_problems[currentIndex];
	const size_t maxSyllables = Max<size_t>(2, problem.maxSyllableCount);

	// カウントダウン
	const int32 remaining = m_timeLimit - static_cast<int32>(m_timer.s());

	// ── タイムアップ分岐 ──
	if (remaining <= 0)
	{
		String autoAnswer(maxSyllables, U'ら');

		m_errorMessage.clear();

		getData().solvedTasks << SolvedTask{
			.phrase = problem.baseTargetText,
			.syllables = problem.targetSyllables,
			.userInput = autoAnswer,
			.userSyllables = splitSyllables(autoAnswer),
			.score = 0.0,  // スコア機能は無効
			.rhymeMatchPercent = 0.0,
			.matchesCount = 0
		};

		++currentIndex;

		if (currentIndex < m_problemCount)
		{
			m_currentTopic = m_problems[currentIndex].questionText;
			m_textState.text.clear();
			prepareQuizChoices();
			m_timer.restart();
		}
		else
		{
			// 最後のお題がタイムアップでも集計してから遷移
			finalizeAndExit();
		}
		return;
	}

	if (m_quizMode)
	{
		constexpr double optionWidth = 260.0;
		constexpr double optionHeight = 86.0;
		constexpr double optionGap = 38.0;
		constexpr double optionY = 828.0;
		const double startX = Scene::Center().x - ((optionWidth * 3.0 + optionGap * 2.0) / 2.0);

		for (size_t i = 0; i < m_quizOptions.size(); ++i)
		{
			const RectF buttonRect{ Vec2{ startX + i * (optionWidth + optionGap), optionY }, SizeF{ optionWidth, optionHeight } };
			const bool selected = buttonRect.leftClicked()
				|| (i == 0 && Key1.down())
				|| (i == 1 && Key2.down())
				|| (i == 2 && Key3.down());

			if (!selected)
			{
				continue;
			}

			if (i != m_correctOptionIndex)
			{
				m_errorMessage = U"ざんねん！問題のグループに合う動詞を選んでね";
				return;
			}

			submitAnswer(m_quizOptions[i].word, m_quizOptions[i].reading);
			return;
		}
		return;
	}

	if (m_textState.enterKey)
	{
		m_textState.enterKey = false;
		const String originalInputText = m_textState.text;

		// ひらがな判定
		if (!isHiraganaOnly(m_textState.text))
		{
			m_errorMessage = U"⚠️ ひらがなのみで入力してください";
			m_textState.active = true;
			return; // ← 処理を中断（送信しない）
		}

		// 先頭が長音ならエラー
		if (!m_textState.text.isEmpty() && m_textState.text.front() == U'ー')
		{
			m_errorMessage = U"⚠️ 言葉の先頭を「ー」から始めることはできません";
			m_textState.active = true;
			return;
		}

		// 促音「っ」が含まれていたらエラー
		if (m_textState.text.includes(U'っ'))
		{
			m_errorMessage = U"⚠️ 「っ」を入力することはできません";
			m_textState.active = true;
			return;
		}

		// 「ー」を直前の母音に変換
		String normalizedText = replaceChoonWithVowel(m_textState.text);

		// 音節分割
		Array<String> syllables2 = splitSyllables(normalizedText);
		const size_t s = syllables2.size();

		// 音節数チェック（2〜問題ごとの最大音節）
		if (s < 2 || s > maxSyllables)
		{
			m_errorMessage = U"⚠️ {}〜{} 音節で入力してください\n（いま {} 音節）"_fmt(
				2, maxSyllables, s);
			m_textState.active = true;
			return;
		}

		// 母音 → ひらがな文字への変換ヘルパー
		auto vowelToKana = [](char v)->String
			{
				switch (v)
				{
				case 'a': return U"あ";
				case 'i': return U"い";
				case 'u': return U"う";
				case 'e': return U"え";
				case 'o': return U"お";
				case 'N': return U"ん";
				case 'Q': return U"っ";
				default:  return U"あ";
				}
			};

		String finalText = normalizedText;
		Array<String> finalSyllables = syllables2;

		if (s < maxSyllables)
		{
			const size_t remainingSlots = (maxSyllables - s);
			const Array<String> particleSyllables = splitSyllables(problem.particleText);
			const bool canAppendParticle =
				(!problem.particleText.isEmpty())
				&& (!particleSyllables.isEmpty())
				&& (particleSyllables.size() <= remainingSlots);

			const char v = getVowel(syllables2.back());
			const String vowelKana = vowelToKana(v);

			auto appendVowelFills = [&](size_t fillCount)
				{
					for (size_t i = 0; i < fillCount; ++i)
					{
						finalText += vowelKana;
						finalSyllables << vowelKana;
					}
				};

			if (canAppendParticle)
			{
				const size_t needVowelFill = remainingSlots - particleSyllables.size();
				appendVowelFills(needVowelFill);
				finalText += problem.particleText;
				for (const auto& syl : particleSyllables)
				{
					finalSyllables << syl;
				}
			}
			else
			{
				appendVowelFills(remainingSlots);
			}
		}

		// 韻スコアは使わないので、0 を入れておくだけ
		getData().solvedTasks << SolvedTask{
			.phrase = problem.baseTargetText,
			.syllables = problem.targetSyllables,
			.userInput = originalInputText,
			.userSyllables = finalSyllables,
			.score = 0.0,
			.rhymeMatchPercent = 0.0,
			.matchesCount = 0
		};

		// エラーは解消されたので消す
		m_errorMessage.clear();

		// 次のお題へ
		++currentIndex;
		m_timer.restart(); // タイマー再スタート

		if (currentIndex < m_problemCount)
		{
			m_currentTopic = m_problems[currentIndex].questionText; // 表示中お題を更新
			prepareQuizChoices();
		}
		else
		{
			finalizeAndExit();
		}

		m_textState.text.clear();
		m_textState.active = true;
	}
}

void WriteLyrics::draw() const
{
	ClearPrint();

	// === カウントダウン表示 ===
	if (m_showCountdown)
	{
		double elapsed = m_countdownTimer.s();
		int remaining = static_cast<int>(Math::Ceil(m_countdownDuration - elapsed));

		String countdownText;
		if (remaining > 0)
			countdownText = Format(remaining);
		else
			countdownText = U"START!";

		background.scaled(1.05).drawAt(Scene::Center());
		m_font(countdownText).drawAt(Scene::Center().movedBy(0, 80), kogetyaColor);
		m_font(getData().songTitle).drawAt(70, Scene::Center().movedBy(0, -120), kogetyaColor);

		return; // カウントダウン中は他を描かない
	}

	// アニメーションの経過時間
	double t = Scene::Time();

	// 経過時間と各フレームのディレイに基づいて、何番目のフレームを描けばよいかを計算する
	size_t frameIndex = AnimatedGIFReader::GetFrameIndex(t, delays);

	textures[frameIndex].drawAt(Scene::Center());

	frame.draw();

	// お題を中央に大きく描画
	if (currentIndex < m_problemCount)
	{
		const auto& problem = m_problems[currentIndex];
		const String displayText = makeQuestionDisplayText(currentIndex, problem.questionText);
		const int32 fontSize = decideQuestionFontSize(problem.questionText);

		m_font(displayText)
			.drawAt(fontSize,
				Vec2{ Scene::Center().x, Scene::Center().y - 105 },
				kogetyaColor);
	}

	if (m_quizMode)
	{
		constexpr double optionWidth = 260.0;
		constexpr double optionHeight = 86.0;
		constexpr double optionGap = 38.0;
		constexpr double optionY = 828.0;
		const double startX = Scene::Center().x - ((optionWidth * 3.0 + optionGap * 2.0) / 2.0);

		for (size_t i = 0; i < m_quizOptions.size(); ++i)
		{
			const RectF buttonRect{ Vec2{ startX + i * (optionWidth + optionGap), optionY }, SizeF{ optionWidth, optionHeight } };
			const ColorF fillColor = buttonRect.mouseOver() ? ColorF{ 1.0, 0.9, 0.58 } : ColorF{ 0.98, 0.82, 0.46 };

			if (buttonRect.mouseOver())
			{
				Cursor::RequestStyle(CursorStyle::Hand);
			}

			buttonRect.rounded(12).draw(fillColor);
			buttonRect.rounded(12).drawFrame(4, 0, kogetyaColor);

			const String optionText = U"{}  {}"_fmt(i + 1, m_quizOptions[i].word);
			const int32 optionFontSize = (optionText.size() <= 5) ? 40 : 34;
			m_font(optionText).drawAt(optionFontSize, buttonRect.center(), kogetyaColor);
		}
	}
	else
	{
		// テキストボックスを下中央に配置
		constexpr double textBoxWidth = 200.0;
		constexpr double yPos = 594.0;
		const double xPos = (Scene::Width() - textBoxWidth) / 2.0;
		const Vec2 textBoxPos{ xPos, yPos };

		// --- スケーリング係数 ---
		const double scale = 4.0;

		// --- マウス入力と描画に同じスケールを適用 ---
		{
			const Transformer2D transformer(Mat3x2::Scale(scale, Scene::Center()), TransformCursor::Yes);

			// スケールが適用された範囲で描画＆マウス操作
			SimpleGUI::TextBox(m_textState, textBoxPos, textBoxWidth);
		}
	}

	// 残りお題カウンターを左上に表示
	if (m_problemCount > 0)
	{
		const String progressText = U"{} / {}"_fmt(currentIndex + 1, m_problemCount);
		m_font(progressText).draw(62, Vec2{ 80, 120 }, kogetyaColor);
	}

	// カウントダウン（右上）
	const int32 remaining = Max(0, m_timeLimit - static_cast<int32>(m_timer.s()));
	const String timeText = U"{}"_fmt(remaining);
	const Vec2 pos{ Scene::Width() - 155, 145 };
	m_font(timeText).drawAt(97, pos, (remaining <= 3 ? Palette::Red : kogetyaColor));

	// 入力エラー表示（あれば）
	if (!m_errorMessage.isEmpty())
	{
		result_font(m_errorMessage)
			.draw(22, Vec2{ 40, 480 }, Palette::Red);
	}
}
