///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// ヘッダー・navi・フッター
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// ページ内の各種データ更新をまとめる関数
function updateAllDisplayData() {
    displaySchedule();  // 日程を表示
    updateStandingsTable();  // 順位表を表示
    updateRankChangeArrows(); // 順位変動の矢印を表示
    displayIndividualRecords(); // 個人戦績を表示
    displayTeamMonthlySchedule(); //チーム日程表の表示
    toggleSeasonView(); // チーム戦績のシーズン切り替えall or current関数
    updateIndividualRecords();  // 個人戦績を更新
}

// // ローカルストレージからシーズン一覧を取得してプルダウンを作成
// function populateSeasonDropdown() {
//     let seasonSelect = document.getElementById('seasonSelect');

//     // 既存の <option> をクリア
//     seasonSelect.innerHTML = '';

//     // シーズン名のリストを取得
//     let seasons = Object.keys(matchDataLCoop);
//     let currentSeason = seasons.length > 0 ? seasons[0] : "24-s1"; // あるなら最初のシーズン、なければ "24-s1"

//     // シーズンが1つもない場合はデフォルトを追加
//     if (seasons.length === 0) {
//         seasons = ["24-s1"]; // 仮のデフォルト
//         matchDataLCoop["24-s1"] = {}; // 空データをセット
//         localStorage.setItem('matchDataLCoop', JSON.stringify(matchDataLCoop));
//     }

//     // シーズンのプルダウンリストを作成
//     seasons.forEach(season => {
//         let option = document.createElement('option');
//         option.value = season;
//         option.textContent = season;
//         if (season === currentSeason) {
//             option.selected = true; // `currentSeason` の場合は選択状態にする
//         }
//         seasonSelect.appendChild(option);
//     });

//     // `currentSeason` をグローバル変数に設定
//     window.currentSeason = currentSeason;
// }


///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// 日程タブ
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// 日程表を表示する関数
function displaySchedule(schedule = null) {
    // let matchDataLCoop = JSON.parse(localStorage.getItem('matchDataLCoop')) || {};
    // let teamsData = JSON.parse(localStorage.getItem('teamsData')) || [];

    if (!matchDataLCoop[currentSeason]) return;

    let startDateStr = matchDataLCoop[currentSeason].newDate;
    let startDate = new Date(startDateStr);

    if (!schedule) {
        schedule = [];
        let totalMatches = Object.keys(matchDataLCoop[currentSeason]).length - 4; 
        let numRounds = totalMatches / (matchDataLCoop[currentSeason].teamsNum / 2);

        for (let round = 0; round < numRounds; round++) {
            let roundMatches = [];
            let roundStartDate = new Date(startDate);
            roundStartDate.setDate(startDate.getDate() + round * 7);

            for (let match = 0; match < matchDataLCoop[currentSeason].teamsNum / 2; match++) {
                let matchKey = `round${round}-match${match}`;
                let matchDataLCoopEntry = matchDataLCoop[currentSeason][matchKey];

                if (!matchDataLCoopEntry) {
                    console.warn(`試合データが見つかりません: ${matchKey}`);
                    continue;
                }

                // 複合チームのチーム名を取得
                let homeTeams = (matchDataLCoopEntry.home.teamIds || [])
                    .map(teamId => {
                        let team = teamsData.find(team => team.teamId === teamId);
                        return team ? getTeamNameByScreenSize(team) : "不明";
                    })
                    .join("<br>");  // HTML内で改行

                let awayTeams = (matchDataLCoopEntry.away.teamIds || [])
                    .map(teamId => {
                        let team = teamsData.find(team => team.teamId === teamId);
                        return team ? getTeamNameByScreenSize(team) : "不明";
                    })
                    .join("<br>");  // HTML内で改行

                let matchDate = matchDataLCoopEntry?.date || roundStartDate.toISOString().split('T')[0];

                roundMatches.push({
                    home: homeTeams, 
                    away: awayTeams,
                    date: matchDate,
                    matchKey: matchKey  // 後で試合データを取得するためにキーを保存
                });
            }
            schedule.push(roundMatches);
        }
    }

    let scheduleHTML = '';
    for (let i = 0; i < schedule.length; i++) {
        let roundStartDate = new Date(startDate);
        roundStartDate.setDate(startDate.getDate() + i * 7);
        let weekInfo = `第${i + 1}節 ${roundStartDate.getFullYear()}年${roundStartDate.getMonth() + 1}月第${Math.ceil(roundStartDate.getDate() / 7)}週`;

        scheduleHTML += `<div class="round" id="round${i}" style="display: none;">`;
        scheduleHTML += `
            <div class="schedule-header sticky-header">
                <h2 class="week-info">${weekInfo}</h2>
                <div class="button-container">
                    <button class="button-common button3" onclick="previousRound()">前節</button>
                    <button class="button-common button3" onclick="nextRound()">次節</button>
                </div>
            </div>`;

        schedule[i].forEach((matchEntry, index) => {
            let matchKey = matchEntry.matchKey;  // 保存しておいたキーを取得
            let matchDataLCoopEntry = matchDataLCoop[currentSeason][matchKey];  // 正しい試合データを取得

            if (!matchDataLCoopEntry) {
                console.warn(`試合データが見つかりません: ${matchKey}`);
                return;
            }

            scheduleHTML += `
                <div class="match-container">
                    <table id="goalDetailsTable${i}-${index}" class="match-table">
                        <thead>
                            <tr>
                                <td colspan="5">日付: <input type="date" id="matchDate${i}-${index}" value="${matchEntry.date}" readonly></td>
                            </tr>
                            <tr>
                                <th id="homeTeam${i}-${index}">${matchEntry.home}</th>
                                <th> <input type="number" id="homeScore${i}-${index}" min="0" placeholder="0" onchange="updateGoalDetails(${i}, ${index}, 'home')" readonly></th>
                                <th> - </th>
                                <th> <input type="number" id="awayScore${i}-${index}" min="0" placeholder="0" onchange="updateGoalDetails(${i}, ${index}, 'away')" readonly></th>
                                <th id="awayTeam${i}-${index}">${matchEntry.away}</th>
                            </tr>
                        </thead>
                        <tbody id="goalDetailsBody${i}-${index}"></tbody>
                    </table>`;

            // スタッツテーブルとポイントテーブルを追加
            const statsTableElement = generateStatsTable(i, index);
            scheduleHTML += statsTableElement.outerHTML;

            // matchDataLCoopEntry を正しく渡す
            scheduleHTML += generatePointTable(i, index, matchDataLCoopEntry).outerHTML;

            scheduleHTML += `
                </div>`;
        });

        scheduleHTML += `</div>`;
    }

    document.getElementById('scheduleContent').innerHTML = scheduleHTML;

    for (let roundIndex = 0; roundIndex < schedule.length; roundIndex++) {
        for (let matchIndex = 0; matchIndex < schedule[roundIndex].length; matchIndex++) {
            loadMatchData(roundIndex, matchIndex);
        }
    }
    currentRound = calculateCurrentRound(startDate, schedule.length);
    showRound(currentRound);
}

// 現在のラウンドを計算する関数
function calculateCurrentRound(startDate, numRounds) {
    const today = new Date();
    
    // リーグ開始前なら第1節
    if (today < startDate) return 0;

    // 経過日数を計算
    const dayDifference = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const weekDifference = Math.floor(dayDifference / 7);

    // 節の範囲を制限（最終節を超えないように）
    return Math.min(weekDifference, numRounds - 1);
}

// 試合詳細のスタッツ表を生成する関数
function generateStatsTable(roundIndex, matchIndex) {
    const statCategories = ["支配率 (%)", "シュート", "枠内シュート", "ファウル", "オフサイド", 
                            "コーナーキック", "フリーキック回数", "パス", "パス成功", 
                            "クロス", "パスカット", "タックル成功", "セーブ"];

    // スタッツテーブルを生成
    const statsTable = createStatsTable(statCategories, roundIndex, matchIndex);
    
    return statsTable;
}

// スタッツ表を作成する関数
function createStatsTable(statCategories, roundIndex, matchIndex) {
    const table = document.createElement('table');
    table.classList.add('stats-table'); // スタイルクラスを追加

    // 1行目に「ハーフタイム」「フルタイム」「空白」「ハーフタイム」「フルタイム」ヘッダを追加
    const headerRow = document.createElement('tr');

    const homeHalfHeader = document.createElement('th');
    homeHalfHeader.textContent = "ハーフタイム";
    
    const homeFullHeader = document.createElement('th');
    homeFullHeader.textContent = "フルタイム";

    const spacerHeader = document.createElement('th');
    spacerHeader.textContent = ""; // 空白のセル

    const awayHalfHeader = document.createElement('th');
    awayHalfHeader.textContent = "ハーフタイム";
    
    const awayFullHeader = document.createElement('th');
    awayFullHeader.textContent = "フルタイム";

    headerRow.appendChild(homeHalfHeader);
    headerRow.appendChild(homeFullHeader);
    headerRow.appendChild(spacerHeader);
    headerRow.appendChild(awayHalfHeader);
    headerRow.appendChild(awayFullHeader);

    table.appendChild(headerRow);

    // 2行目以降にスタッツ行を追加
    statCategories.forEach((category, index) => {
        const row = document.createElement('tr');

        // ホームチームのハーフタイム入力欄
        const homeHalfInput = document.createElement('input');
        homeHalfInput.type = "number";
        homeHalfInput.id = `homeHalfStat${index}-${roundIndex}-${matchIndex}`;
        homeHalfInput.placeholder = "0";
        homeHalfInput.min = (index === 0) ? "0" : "0";  // 支配率なら0～100に制限
        homeHalfInput.max = (index === 0) ? "100" : "";
        homeHalfInput.readOnly = true;  // readonlyを追加

        // ホームチームのフルタイム入力欄
        const homeFullInput = document.createElement('input');
        homeFullInput.type = "number";
        homeFullInput.id = `homeFullStat${index}-${roundIndex}-${matchIndex}`;
        homeFullInput.placeholder = "0";
        homeFullInput.min = (index === 0) ? "0" : "0";
        homeFullInput.max = (index === 0) ? "100" : "";
        homeHalfInput.readOnly = true;  // readonlyを追加

        // 真ん中列（データの説明）
        const categoryCell = document.createElement('td');
        categoryCell.textContent = category;

        // アウェーチームのハーフタイム入力欄
        const awayHalfInput = document.createElement('input');
        awayHalfInput.type = "number";
        awayHalfInput.id = `awayHalfStat${index}-${roundIndex}-${matchIndex}`;
        awayHalfInput.placeholder = "0";
        awayHalfInput.min = (index === 0) ? "0" : "0";
        awayHalfInput.max = (index === 0) ? "100" : "";
        homeHalfInput.readOnly = true;  // readonlyを追加

        // アウェーチームのフルタイム入力欄
        const awayFullInput = document.createElement('input');
        awayFullInput.type = "number";
        awayFullInput.id = `awayFullStat${index}-${roundIndex}-${matchIndex}`;
        awayFullInput.placeholder = "0";
        awayFullInput.min = (index === 0) ? "0" : "0";
        awayFullInput.max = (index === 0) ? "100" : "";
        homeHalfInput.readOnly = true;  // readonlyを追加

        // 行にセルを追加
        const homeHalfCell = document.createElement('td');
        homeHalfCell.appendChild(homeHalfInput);
        
        const homeFullCell = document.createElement('td');
        homeFullCell.appendChild(homeFullInput);
        
        const awayHalfCell = document.createElement('td');
        awayHalfCell.appendChild(awayHalfInput);
        
        const awayFullCell = document.createElement('td');
        awayFullCell.appendChild(awayFullInput);

        row.appendChild(homeHalfCell);
        row.appendChild(homeFullCell);
        row.appendChild(categoryCell);
        row.appendChild(awayHalfCell);
        row.appendChild(awayFullCell);

        table.appendChild(row);
    });

    return table;
}

// 試合詳細のポイント表を生成する関数
function generatePointTable(roundIndex, matchIndex, matchData) {
    if (!matchData || !matchData.home || !matchData.away) {
        console.error(`試合データが不正です: round${roundIndex}-match${matchIndex}`, matchData);
        return document.createElement('div'); // エラー時に空の要素を返す
    }

    const homeTeamIds = matchData.home.teamIds || [];
    const awayTeamIds = matchData.away.teamIds || [];

    if (!Array.isArray(homeTeamIds) || !Array.isArray(awayTeamIds)) {
        console.error(`チームIDの配列が不正です: homeTeamIds=${homeTeamIds}, awayTeamIds=${awayTeamIds}`);
        return document.createElement('div'); // エラー時に空の要素を返す
    }

    return createPointTable(["オフェンスポジショニング", "シュート", "デュエル", "ディフェンスポジショニング", "パス", "ドリブル"], 
                            roundIndex, matchIndex, homeTeamIds, awayTeamIds);
}

// ポイント表を作成する関数
function createPointTable(pointCategories, roundIndex, matchIndex, homeTeamIds = [], awayTeamIds = []) {
    if (!Array.isArray(homeTeamIds) || !Array.isArray(awayTeamIds)) {
        console.error(`チームIDが配列でない: home=${homeTeamIds}, away=${awayTeamIds}`);
        return document.createElement('div'); // エラー時に空の要素を返す
    }

    // let teamsData = JSON.parse(localStorage.getItem('teamsData')) || [];
    const table = document.createElement('table');
    table.classList.add('points-table');

    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')); // 左上の空白セル

    // ホームチームのヘッダー
    homeTeamIds.forEach((teamId) => {
        const team = teamsData.find(t => t.teamId === teamId);
        const teamName = team ? getTeamNameByScreenSize(team) : "不明";
        const homeHeader = document.createElement('th');
        homeHeader.textContent = teamName;
        headerRow.appendChild(homeHeader);
    });

    const vsHeader = document.createElement('th');
    vsHeader.textContent = "VS";
    headerRow.appendChild(vsHeader);

    // アウェイチームのヘッダー
    awayTeamIds.forEach((teamId) => {
        const team = teamsData.find(t => t.teamId === teamId);
        const teamName = team ? getTeamNameByScreenSize(team) : "不明";
        const awayHeader = document.createElement('th');
        awayHeader.textContent = teamName;
        headerRow.appendChild(awayHeader);
    });

    table.appendChild(headerRow);

    // **総合ポイントの行**
    const totalRow = document.createElement('tr');
    const totalHeader = document.createElement('td');
    totalHeader.textContent = "総合ポイント";
    totalRow.appendChild(totalHeader);

    homeTeamIds.forEach((_, index) => {
        let totalCell = document.createElement('td');
        totalCell.id = `homeTotalPoints-${index}-${roundIndex}-${matchIndex}`;
        totalCell.classList.add("total-score"); // クラス追加
        totalCell.textContent = "0"; // 初期値
        totalRow.appendChild(totalCell);
    });

    totalRow.appendChild(document.createElement('td')).textContent = "-"; // VS 列

    awayTeamIds.forEach((_, index) => {
        let totalCell = document.createElement('td');
        totalCell.id = `awayTotalPoints-${index}-${roundIndex}-${matchIndex}`;
        totalCell.classList.add("total-score"); // クラス追加
        totalCell.textContent = "0"; // 初期値
        totalRow.appendChild(totalCell);
    });

    table.appendChild(totalRow);

    // **各カテゴリごとの行**
    pointCategories.forEach((category, statIndex) => {
        const row = document.createElement('tr');
        const categoryCell = document.createElement('td');
        categoryCell.textContent = category;
        row.appendChild(categoryCell);

        homeTeamIds.forEach((_, index) => {
            const homeInput = document.createElement('input');
            homeInput.type = "number";
            homeInput.id = `homePoint${statIndex}-${index}-${roundIndex}-${matchIndex}`;
            homeInput.placeholder = "0";
            homeInput.min = "0";
            homeInput.oninput = () => updateTotalPoints(roundIndex, matchIndex, homeTeamIds.length, awayTeamIds.length);
            row.appendChild(document.createElement('td')).appendChild(homeInput);
        });

        row.appendChild(document.createElement('td')).textContent = "-";

        awayTeamIds.forEach((_, index) => {
            const awayInput = document.createElement('input');
            awayInput.type = "number";
            awayInput.id = `awayPoint${statIndex}-${index}-${roundIndex}-${matchIndex}`;
            awayInput.placeholder = "0";
            awayInput.min = "0";
            awayInput.oninput = () => updateTotalPoints(roundIndex, matchIndex, homeTeamIds.length, awayTeamIds.length);
            row.appendChild(document.createElement('td')).appendChild(awayInput);
        });

        table.appendChild(row);
    });

    // **テーブルを作成したら即時更新**
    setTimeout(() => updateTotalPoints(roundIndex, matchIndex, homeTeamIds.length, awayTeamIds.length), 100);

    return table;
}

function updateTotalPoints(roundIndex, matchIndex, homeSize, awaySize) {
    const pointCategories = ["OffensePositioning", "shot", "duel", "defensePositioning", "pass", "dribble"];

    // ホームチームの総合ポイントを計算
    for (let i = 0; i < homeSize; i++) {
        let total = 0;
        pointCategories.forEach((_, statIndex) => {
            let value = document.getElementById(`homePoint${statIndex}-${i}-${roundIndex}-${matchIndex}`)?.value;
            let numValue = value !== "" ? parseInt(value) || 0 : 0;
            total += numValue;
        });

        let totalCell = document.getElementById(`homeTotalPoints-${i}-${roundIndex}-${matchIndex}`);
        if (totalCell) {
            totalCell.textContent = total;
        }
    }

    // アウェイチームの総合ポイントを計算
    for (let i = 0; i < awaySize; i++) {
        let total = 0;
        pointCategories.forEach((_, statIndex) => {
            let value = document.getElementById(`awayPoint${statIndex}-${i}-${roundIndex}-${matchIndex}`)?.value;
            let numValue = value !== "" ? parseInt(value) || 0 : 0;
            total += numValue;
        });

        let totalCell = document.getElementById(`awayTotalPoints-${i}-${roundIndex}-${matchIndex}`);
        if (totalCell) {
            totalCell.textContent = total;
        }
    }
}

// ラウンドを表示する関数
function showRound(round) {
    let allRounds = document.querySelectorAll('.round');
    allRounds.forEach((roundDiv, index) => {
        roundDiv.style.display = index === round ? 'block' : 'none';
    });
}

// 前節ボタンをクリックした時の処理
function previousRound() {
    if (currentRound > 0) {
        currentRound--;
        showRound(currentRound);
    }
}

// 次節ボタンをクリックした時の処理
function nextRound() {
    let allRounds = document.querySelectorAll('.round');
    if (currentRound < allRounds.length - 1) {
        currentRound++;
        showRound(currentRound);
    }
}

// 得点の詳細タブ追加に関する関数
function updateGoalDetails(roundIndex, matchIndex, teamType, data = null) {
    let goalDetailsBody = document.getElementById(`goalDetailsBody${roundIndex}-${matchIndex}`);

    // スコアに基づいて得点詳細行を生成
    let score = data ? data.score : parseInt(document.getElementById(`${teamType}Score${roundIndex}-${matchIndex}`).value) || 0;
    let assistPlayers = data ? data.assistPlayers : [];
    let goalPlayers = data ? data.goalPlayers : [];
    let times = data ? data.times : [];

    // 既存のゴール詳細行を削除（ホーム・アウェイそれぞれ個別に行を管理）
    let existingRows = Array.from(goalDetailsBody.querySelectorAll('tr'));
    let currentRows = existingRows.filter(row => row.querySelector(`.goal-time.${teamType}`));

    // 既存行数と新しい得点に基づいて、行の増減を行う
    if (currentRows.length > score) {
        // 行を削除（得点が減った場合）
        for (let i = currentRows.length - 1; i >= score; i--) {
            goalDetailsBody.removeChild(currentRows[i]);
        }
    } else if (currentRows.length < score) {
        // 行を追加（得点が増えた場合）
        for (let i = currentRows.length; i < score; i++) {
            let assist = assistPlayers[i] || '';
            let goal = goalPlayers[i] || '';
            let time = times[i] || '';

            let rowHTML = `
                <tr>
                    <td colspan="2">
                        ${teamType === 'home' ? `
                            アシスト：<input type="text" class="assist-player home" value="${assist}" readonly>
                            ゴール　：<input type="text" class="goal-player home" value="${goal}" readonly>
                        ` : `<span></span>`}
                    </td>
                    <td>
                        <input type="number" class="goal-time ${teamType}" value="${time}" min="0" step="1" onchange="sortGoalDetails(${roundIndex}, ${matchIndex})" readonly> 分
                    </td>

                    <td colspan="2">
                        ${teamType === 'away' ? `
                            アシスト：<input type="text" class="assist-player away" value="${assist}" readonly>
                            ゴール　：<input type="text" class="goal-player away" value="${goal}" readonly>
                        ` : `<span></span>`}
                    </td>
                </tr>
            `;
            goalDetailsBody.insertAdjacentHTML('beforeend', rowHTML);
        }
    }

    // 行の並び替えを適用
    sortGoalDetails(roundIndex, matchIndex);
}

// 時間に合わせて得点情報を並べ替える関数
function sortGoalDetails(roundIndex, matchIndex) {
    let goalDetailsBody = document.getElementById(`goalDetailsBody${roundIndex}-${matchIndex}`);
    let rows = Array.from(goalDetailsBody.querySelectorAll('tr'));

    // 時間を取得して並び替え
    rows.sort((rowA, rowB) => {
        let timeA = rowA.querySelector('.goal-time').value.replace('分', '') || '9999';
        let timeB = rowB.querySelector('.goal-time').value.replace('分', '') || '9999';

        return parseInt(timeA) - parseInt(timeB);
    });

    // 並び替え後の行を再配置
    rows.forEach(row => goalDetailsBody.appendChild(row));
}

// 日程表データの自動読み込みをする関数
function loadMatchData(roundIndex, matchIndex) {
    // let matchDataLCoop = JSON.parse(localStorage.getItem('matchDataLCoop')) || {};

    // シーズンデータが存在しない場合は何もしない
    if (!matchDataLCoop[currentSeason]) return;

    let matchKey = `round${roundIndex}-match${matchIndex}`;

    if (matchDataLCoop[currentSeason][matchKey]) {
        let match = matchDataLCoop[currentSeason][matchKey];

        // スコアを表示
        let homeScoreEl = document.getElementById(`homeScore${roundIndex}-${matchIndex}`);
        let awayScoreEl = document.getElementById(`awayScore${roundIndex}-${matchIndex}`);
        if (homeScoreEl) homeScoreEl.value = match.home.score !== null ? match.home.score : '';
        if (awayScoreEl) awayScoreEl.value = match.away.score !== null ? match.away.score : '';

        // スタッツデータを表示（ハーフタイムとフルタイム）
        const statCategories = [
            "possession", "shots", "shotsonFrame", "fouls", "offsides",
            "cornerKicks", "freeKicks", "passes", "successfulPasses",
            "crosses", "PassCuts", "successfulTackles", "save"
        ];

        statCategories.forEach((category, index) => {
            let homeHalfEl = document.getElementById(`homeHalfStat${index}-${roundIndex}-${matchIndex}`);
            let homeFullEl = document.getElementById(`homeFullStat${index}-${roundIndex}-${matchIndex}`);
            let awayHalfEl = document.getElementById(`awayHalfStat${index}-${roundIndex}-${matchIndex}`);
            let awayFullEl = document.getElementById(`awayFullStat${index}-${roundIndex}-${matchIndex}`);

            if (homeHalfEl) homeHalfEl.value = match.home.halfTime[category] !== null ? match.home.halfTime[category] : '';
            if (homeFullEl) homeFullEl.value = match.home.fullTime[category] !== null ? match.home.fullTime[category] : '';
            if (awayHalfEl) awayHalfEl.value = match.away.halfTime[category] !== null ? match.away.halfTime[category] : '';
            if (awayFullEl) awayFullEl.value = match.away.fullTime[category] !== null ? match.away.fullTime[category] : '';
        });

        // 【追加】pointsデータの読み込み
        const pointCategories = ["OffensePositioning", "shot", "duel", "defensePositioning", "pass", "dribble"];

        pointCategories.forEach((category, statIndex) => {
            match.home.teamIds.forEach((teamId, teamIndex) => {
                let homePointEl = document.getElementById(`homePoint${statIndex}-${teamIndex}-${roundIndex}-${matchIndex}`);
                if (homePointEl) {
                    homePointEl.value = match.home.points?.[category]?.[teamIndex] !== null ? match.home.points[category][teamIndex] : '';
                }
            });

            match.away.teamIds.forEach((teamId, teamIndex) => {
                let awayPointEl = document.getElementById(`awayPoint${statIndex}-${teamIndex}-${roundIndex}-${matchIndex}`);
                if (awayPointEl) {
                    awayPointEl.value = match.away.points?.[category]?.[teamIndex] !== null ? match.away.points[category][teamIndex] : '';
                }
            });
        });

        // スコアに基づいて得点詳細行を表示
        updateGoalDetails(roundIndex, matchIndex, 'home', match.home);
        updateGoalDetails(roundIndex, matchIndex, 'away', match.away);
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////
// 順位表タブ
///////////////////////////////////////////////////////////////////////////////////////////////////
// **総ポイントを保存するグローバル変数**
// **グローバル変数として `totalPointsMap` を定義**
// 
function calculateStandings() {
    if (!matchDataLCoop[currentSeason]) return [];

    let participatingTeams = new Set();
    let teamGroups = new Map(); // 複合チームごとのデータを保存

    // 出場した複合チームの `teamIds` セットをキーとして保持
    for (const matchKey in matchDataLCoop[currentSeason]) {
        if (["teamsNum", "currentStandings", "newDate", "teamSize"].includes(matchKey)) continue;

        let match = matchDataLCoop[currentSeason][matchKey];
        let homeTeamKey = match.home.teamIds.sort().join("-"); // 例: "0-1-2"
        let awayTeamKey = match.away.teamIds.sort().join("-");

        participatingTeams.add(homeTeamKey);
        participatingTeams.add(awayTeamKey);

        if (!teamGroups.has(homeTeamKey)) teamGroups.set(homeTeamKey, match.home.teamIds);
        if (!teamGroups.has(awayTeamKey)) teamGroups.set(awayTeamKey, match.away.teamIds);
    }

    // standings 配列を作成（複合チーム単位）
    let standings = Array.from(participatingTeams).map(teamKey => ({
        teamKey: teamKey, // "0-1-2" のようなキー
        teamIds: teamGroups.get(teamKey), // チームIDの配列
        points: 0,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalDifference: 0,
        totalGoals: 0,
        currentRank: null
    }));

    for (const matchKey in matchDataLCoop[currentSeason]) {
        if (["teamsNum", "currentStandings", "newDate", "teamSize"].includes(matchKey)) continue;

        let match = matchDataLCoop[currentSeason][matchKey];
        let homeScore = match.home.score;
        let awayScore = match.away.score;

        if (homeScore === null || awayScore === null) continue;

        let homeTeamKey = match.home.teamIds.sort().join("-");
        let awayTeamKey = match.away.teamIds.sort().join("-");
        let homeTeam = standings.find(t => t.teamKey === homeTeamKey);
        let awayTeam = standings.find(t => t.teamKey === awayTeamKey);

        if (homeTeam && awayTeam) {
            if (homeScore > awayScore) {
                homeTeam.wins++;
                homeTeam.points += 3;
                awayTeam.losses++;
            } else if (homeScore < awayScore) {
                awayTeam.wins++;
                awayTeam.points += 3;
                homeTeam.losses++;
            } else {
                homeTeam.draws++;
                awayTeam.draws++;
                homeTeam.points++;
                awayTeam.points++;
            }

            homeTeam.matchesPlayed++;
            awayTeam.matchesPlayed++;
            homeTeam.totalGoals += homeScore;
            awayTeam.totalGoals += awayScore;
            homeTeam.goalDifference += (homeScore - awayScore);
            awayTeam.goalDifference += (awayScore - homeScore);
        }
    }

    // 順位計算（勝ち点 → 得失点差 → 総得点順）
    standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.totalGoals - a.totalGoals;
    });

    standings.forEach((standing, index) => {
        standing.currentRank = index + 1;
    });

    return standings;
}








// 順位表を更新する関数
function updateStandingsTable() {
    let standings = calculateStandings();
    
    if (!matchDataLCoop[currentSeason] || !matchDataLCoop[currentSeason].currentStandings) return;
    
    let tbody = document.querySelector('#standingsTable tbody');
    tbody.innerHTML = ''; 

    standings.forEach(team => {
        let teamNames = team.teamIds.map(teamId => {
            let teamInfo = teamsData.find(t => t.teamId === teamId);
            return teamInfo ? getTeamNameByScreenSize(teamInfo) : "不明";
        }).join("<br>"); // チーム名を改行して表示

        let teamInfo = teamsData.find(t => t.teamId === team.teamIds[0]); // 最初のチームの色を適用
        let teamColor = teamInfo ? `#${teamInfo.teamsColor}` : "#FFFFFF";

        let row = `
            <tr>
                <td>${team.currentRank}</td>
                <td style="background-color:${teamColor}; color:white; font-weight:bold; text-align:center;">${teamNames}</td>
                <td>${team.points}</td>
                <td>${team.matchesPlayed}</td>
                <td>${team.wins}</td>
                <td>${team.draws}</td>
                <td>${team.losses}</td>
                <td>${team.goalDifference}</td>
                <td>${team.totalGoals}</td>
            </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}








function updateRankChangeArrows() {
    let currentStandings = matchDataLCoop[currentSeason]?.currentStandings || [];
    let standings = calculateStandings(); // 現在の順位を再計算

    let tbody = document.querySelector('#standingsTable tbody');
    tbody.innerHTML = ''; // 順位表を初期化

    standings.forEach(team => {
        // `teamId` に対応する `previousRank` を取得
        let previousRank = currentStandings.findIndex(t => t.teamKey === team.teamKey) + 1;
        let currentRank = team.currentRank;

        let rankChange = '';
        let rankClass = '';

        if (previousRank > 0) { // `findIndex` は見つからないと `-1` を返すので、順位がある場合のみ処理
            if (currentRank < previousRank) {
                rankChange = '▲'; // 順位上昇
                rankClass = 'rank-up';
            } else if (currentRank > previousRank) {
                rankChange = '▼'; // 順位下降
                rankClass = 'rank-down';
            } else {
                rankChange = '---'; // 順位変動なし
                rankClass = 'rank-no-change';
            }
        } else {
            rankChange = '-';
            rankClass = 'rank-no-change';
        }

        // **チーム名を取得（複数チームを改行で表示）**
        let teamNames = team.teamIds.map(teamId => {
            let teamInfo = teamsData.find(t => t.teamId === teamId);
            return teamInfo ? getTeamNameByScreenSize(teamInfo) : "不明"; // `undefined` なら "不明"
        }).join("<br>");

        // **エラーハンドリングを追加**
        if (!teamNames) {
            console.warn(`チーム名が取得できません: teamKey = ${team.teamKey}, teamIds = ${team.teamIds}`);
            teamNames = "不明";
        }

        

        let row = `
            <tr>
                <td>${team.currentRank} <span class="${rankClass}">${rankChange}</span></td>
                <td>${teamNames}</td>
                <td>${team.points}</td>
                <td>${team.matchesPlayed}</td>
                <td>${team.wins}</td>
                <td>${team.draws}</td>
                <td>${team.losses}</td>
                <td>${team.goalDifference}</td>
                <td>${team.totalGoals}</td>
            </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}


// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// // 個人戦績タブ
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////////
function displayIndividualRecords() {
    let individualRecords = JSON.parse(localStorage.getItem('individualRecords')) || { assists: {}, goals: {} };

    // アシストのランキングを表示
    let assistsTable = document.getElementById('assistPlayersTable');
    let goalsTable = document.getElementById('goalPlayersTable');

    if (!assistsTable || !goalsTable) return; // HTMLが読み込まれていない場合は処理を中断

    // テーブルをクリア
    assistsTable.querySelector('tbody').innerHTML = '';
    goalsTable.querySelector('tbody').innerHTML = '';

    // アシストランキング
    let assistsSorted = Object.entries(individualRecords.assists).sort((a, b) => b[1] - a[1]);
    assistsSorted.forEach(([player, count], index) => {
        let row = `<tr><td>${index + 1}</td><td>${player}</td><td>${count}</td></tr>`;
        assistsTable.querySelector('tbody').insertAdjacentHTML('beforeend', row);
    });

    // ゴールランキング
    let goalsSorted = Object.entries(individualRecords.goals).sort((a, b) => b[1] - a[1]);
    goalsSorted.forEach(([player, count], index) => {
        let row = `<tr><td>${index + 1}</td><td>${player}</td><td>${count}</td></tr>`;
        goalsTable.querySelector('tbody').insertAdjacentHTML('beforeend', row);
    });
}

function updateIndividualRecords() {
    // let currentSeason = "24-s1";

    if (!matchDataLCoop[currentSeason]) return;

    let goalPlayers = {};
    let assistPlayers = {};

    // 各試合のデータを集計
    Object.keys(matchDataLCoop[currentSeason]).forEach(matchKey => {
        if (matchKey === "teamsNum" || matchKey === "currentStandings"|| matchKey === "newDate") return; // 試合データ以外をスキップ
        
        let match = matchDataLCoop[currentSeason][matchKey];

        // ホームチームのゴールとアシストをカウント
        if (match.home && Array.isArray(match.home.goalPlayers)) {
            match.home.goalPlayers.forEach(player => {
                if (player) {
                    goalPlayers[player] = (goalPlayers[player] || 0) + 1;
                }
            });
        }
        if (match.home && Array.isArray(match.home.assistPlayers)) {
            match.home.assistPlayers.forEach(player => {
                if (player) {
                    assistPlayers[player] = (assistPlayers[player] || 0) + 1;
                }
            });
        }

        // アウェイチームのゴールとアシストをカウント
        if (match.away && Array.isArray(match.away.goalPlayers)) {
            match.away.goalPlayers.forEach(player => {
                if (player) {
                    goalPlayers[player] = (goalPlayers[player] || 0) + 1;
                }
            });
        }
        if (match.away && Array.isArray(match.away.assistPlayers)) {
            match.away.assistPlayers.forEach(player => {
                if (player) {
                    assistPlayers[player] = (assistPlayers[player] || 0) + 1;
                }
            });
        }
    });

    // ゴールランキングの表示
    displayPlayerRanking('goalPlayersTable', goalPlayers);

    // アシストランキングの表示
    displayPlayerRanking('assistPlayersTable', assistPlayers);
}

// ランキング表示用の関数
function displayPlayerRanking(tableId, players) {
    let table = document.getElementById(tableId);
    if (!table) return; // HTMLが読み込まれていない場合は処理を中断

    let sortedPlayers = Object.entries(players).sort((a, b) => b[1] - a[1]); // 得点順にソート
    let tbody = table.querySelector('tbody');
    tbody.innerHTML = '';  // テーブルを初期化

    let rank = 1;  // 順位
    let prevScore = null;  // 前のスコア
    let displayRank = rank; // 表示する順位

    sortedPlayers.forEach(([player, count], index) => {
        // 前のスコアと異なる場合は順位を更新
        if (prevScore !== count) {
            displayRank = rank;  // 表示する順位を更新
        }

        prevScore = count;  // 前のスコアを更新
        rank++; // 次の順位へインクリメント

        let row = `
            <tr>
                <td>${displayRank}</td>  <!-- 順位 -->
                <td>${player}</td>  <!-- 選手名 -->
                <td>${count}</td>  <!-- 得点/アシスト数 -->
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}
