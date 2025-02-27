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
    displayIndividualRecords(); // 個人戦績を表示
    displayTeamMonthlySchedule(); //チーム日程表の表示
    toggleSeasonView(); // チーム戦績のシーズン切り替えall or current関数
    updateIndividualRecords();  // 個人戦績を更新
    generateTournamentBracket(); // トーナメント表を表示
}

// ローカルストレージからシーズン一覧を取得してプルダウンを作成
function populateSeasonDropdown() {
    let seasonSelect = document.getElementById('seasonSelect');

    // 既存の <option> をクリア
    seasonSelect.innerHTML = '';

    // シーズン名のリストを取得
    let seasons = Object.keys(matchDataT);
    let currentSeason = seasons.length > 0 ? seasons[0] : "24-s1"; // あるなら最初のシーズン、なければ "24-s1"

    // シーズンが1つもない場合はデフォルトを追加
    if (seasons.length === 0) {
        seasons = ["24-s1"]; // 仮のデフォルト
        matchDataT["24-s1"] = {}; // 空データをセット
        localStorage.setItem('matchDataT', JSON.stringify(matchDataT));
    }

    // シーズンのプルダウンリストを作成
    seasons.forEach(season => {
        let option = document.createElement('option');
        option.value = season;
        option.textContent = season;
        if (season === currentSeason) {
            option.selected = true; // `currentSeason` の場合は選択状態にする
        }
        seasonSelect.appendChild(option);
    });

    // `currentSeason` をグローバル変数に設定
    window.currentSeason = currentSeason;
}


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

    // シーズンデータが存在しない場合は何もしない
    if (!matchDataT[currentSeason]) return;

    // リーグ開始日を取得
    let startDateStr = matchDataT[currentSeason].newDate || "2024-10-13"; // デフォルト値を設定
    let startDate = new Date(startDateStr);
    
    // 保存されたスケジュールを取得
    if (!schedule) {
        schedule = [];
        let numRounds = Math.ceil(Math.log2(matchDataT[currentSeason].teamsNum));

        for (let round = 0; round < numRounds; round++) {
            let roundMatches = [];
            let roundStartDate = new Date(startDate);
            roundStartDate.setDate(startDate.getDate() + round * 7);

            let numMatches = Math.pow(2, numRounds - round - 1);
            if (round === numRounds - 1 && matchDataT[currentSeason].teamsNum >= 4) {
                numMatches = 2;
            }

            for (let match = 0; match < numMatches; match++) {
                let matchKey = `round${round}-match${match}`;
                let matchDataTEntry = matchDataT[currentSeason][matchKey];

                let homeTeam = matchDataTEntry?.home?.teamId ? 
                    teamsData.find(team => team.teamId === matchDataTEntry.home.teamId) : null;
                let awayTeam = matchDataTEntry?.away?.teamId ? 
                    teamsData.find(team => team.teamId === matchDataTEntry.away.teamId) : null;

                // **非表示にせずプレースホルダーを設定**
                let matchDate = matchDataTEntry?.date || roundStartDate.toISOString().split('T')[0];

                roundMatches.push({
                    home: homeTeam ? getTeamNameByScreenSize(homeTeam) : "未定",
                    away: awayTeam ? getTeamNameByScreenSize(awayTeam) : "未定",
                    homeTeamId: homeTeam ? homeTeam.teamId : null,
                    awayTeamId: awayTeam ? awayTeam.teamId : null,
                    date: matchDate,
                    matchKey: matchKey
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
        scheduleHTML +=  `
            <div class="schedule-header sticky-header">
                <h2 class="week-info">${weekInfo}</h2>
                <div class="button-container">
                    <button class="button-common button3" onclick="previousRound()">前節</button>
                    <button class="button-common button3" onclick="nextRound()">次節</button>
                </div>
            </div>`;
        schedule[i].forEach((matchEntry, index) => {
            scheduleHTML += `
                <div class="match-container">
                    <table id="goalDetailsTable${i}-${index}" class="match-table">
                        <thead>
                            <tr>
                                <td colspan="5"><input type="date" id="matchDate${i}-${index}" value="${matchEntry.date}" readonly></td>
                            </tr>
                            <tr>
                                <th id="homeTeam${i}-${index}">${matchEntry.home}</th>
                                <th> <input type="number" id="homeScore${i}-${index}" min="0" placeholder="0" onchange="updateGoalDetails(${i}, ${index}, 'home')"readonly></th>
                                <th> - </th>
                                <th id="awayTeam${i}-${index}"><input type="number" id="awayScore${i}-${index}" min="0" placeholder="0" onchange="updateGoalDetails(${i}, ${index}, 'away')"readonly></th>
                                <th> ${matchEntry.away}</th>
                            </tr>
                            <tr>
                                <td colspan="2"><label>PK</label> <input type="number" id="homePK${i}-${index}" min="0" placeholder="0" readonly></td>
                                <td>PK戦</td>
                                <td colspan="2"><label>PK</label> <input type="number" id="awayPK${i}-${index}" min="0" placeholder="0" readonly></td>
                            </tr>
                        </thead>
                        <tbody id="goalDetailsBody${i}-${index}"></tbody>
                    </table>`;

            const statsTableElement = generateStatsTable(i, index);
            scheduleHTML += statsTableElement.outerHTML;
            scheduleHTML += `</div>`;
        });
        scheduleHTML += `</div>`;
    }

    document.getElementById('scheduleContent').innerHTML = scheduleHTML;

    for (let roundIndex = 0; roundIndex < schedule.length; roundIndex++) {
        for (let matchIndex = 0; matchIndex < schedule[roundIndex].length; matchIndex++) {
            loadMatchData(roundIndex, matchIndex);
        }
    }

    // **現在のラウンドを計算**
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

// 得点詳細のスタッツ表を作成する関数
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
        homeFullInput.readOnly = true;  // readonlyを追加

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
        awayHalfInput.readOnly = true;  // readonlyを追加

        // アウェーチームのフルタイム入力欄
        const awayFullInput = document.createElement('input');
        awayFullInput.type = "number";
        awayFullInput.id = `awayFullStat${index}-${roundIndex}-${matchIndex}`;
        awayFullInput.placeholder = "0";
        awayFullInput.min = (index === 0) ? "0" : "0";
        awayFullInput.max = (index === 0) ? "100" : "";
        awayFullInput.readOnly = true;  // readonlyを追加

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
    // let currentSeason = "24-s1"; // 現在のシーズンを指定（必要に応じて変更）

    // シーズンデータが存在しない場合は何もしない
    if (!matchDataT[currentSeason]) return;

    let matchKey = `round${roundIndex}-match${matchIndex}`;

    if (matchDataT[currentSeason][matchKey]) {
        let match = matchDataT[currentSeason][matchKey];
        // スコアを表示
        document.getElementById(`homeScore${roundIndex}-${matchIndex}`).value = match.home.score !== null ? match.home.score : '';
        document.getElementById(`awayScore${roundIndex}-${matchIndex}`).value = match.away.score !== null ? match.away.score : '';

        // スタッツデータを表示（ハーフタイムとフルタイム）
        const statCategories = ["possession", "shots", "shotsonFrame", "fouls", "offsides", "cornerKicks", "freeKicks", "passes", "successfulPasses", "crosses", "PassCuts", "successfulTackles", "save"];

        statCategories.forEach((category, index) => {
            document.getElementById(`homeHalfStat${index}-${roundIndex}-${matchIndex}`).value = match.home.halfTime[category] !== null ? match.home.halfTime[category] : '';
            document.getElementById(`homeFullStat${index}-${roundIndex}-${matchIndex}`).value = match.home.fullTime[category] !== null ? match.home.fullTime[category] : '';
            document.getElementById(`awayHalfStat${index}-${roundIndex}-${matchIndex}`).value = match.away.halfTime[category] !== null ? match.away.halfTime[category] : '';
            document.getElementById(`awayFullStat${index}-${roundIndex}-${matchIndex}`).value = match.away.fullTime[category] !== null ? match.away.fullTime[category] : '';
        });
        // スコアに基づいて得点詳細行を表示
        updateGoalDetails(roundIndex, matchIndex, 'home', match.home);
        updateGoalDetails(roundIndex, matchIndex, 'away', match.away);
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// トーナメント表タブ
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////


function generateTournamentBracket() {
    if (!matchDataT[currentSeason]) return;

    let container = document.getElementById("tournament-container");
    container.innerHTML = "";

    // 設定可能な変数
    let cellHeight = 30; // セルの高さ
    let spacingUnit = 5; // セル間の間隔
    let lineWidth = 10; // 横棒の長さ
    let lineHeight = 2; // 棒の太さ

    let cssStyles = ""; // すべてのCSSを格納する

    let numRounds = Math.ceil(Math.log2(matchDataT[currentSeason].teamsNum));
    let maxContainerWidth = Math.min(window.innerWidth, (numRounds+1) * 90); // 最大幅を制限
    container.style.maxWidth = `${maxContainerWidth}px`;
    container.style.overflowX = "auto"; // スクロールバーを有効にする
    for (let round = 0; round < numRounds; round++) {
        let numMatches = Math.pow(2, numRounds - round - 1);
        let table = document.createElement("table");
        table.classList.add("tournament-table");
        let tbody = document.createElement("tbody");
        table.appendChild(tbody);

        let offset = (cellHeight + spacingUnit) * (Math.pow(2, round - 1) - 0.5);
        table.style.marginTop = offset > 0 ? `${-offset}px` : "0px";

        // **セルの間隔を可変にする**
        let spacing = cellHeight * (Math.pow(2, round) - 1) + spacingUnit * Math.pow(2, round);
        let verticalLineHeight = (cellHeight + spacing) / 2; // 縦棒の長さ
        table.style.borderSpacing = `0 ${spacing}px`;  // **ここでセルの間隔を調整**

        for (let match = 0; match < numMatches; match++) {
            let matchKey = `round${round}-match${match}`;
            let matchDataTKey = matchDataT[currentSeason][matchKey] || {};
        
            let homeTeamData = teamsData.find(team => team.teamId === matchDataTKey?.home?.teamId);
            let awayTeamData = teamsData.find(team => team.teamId === matchDataTKey?.away?.teamId);
        
            let homeTeam = homeTeamData?.teamsSub || "未定";
            let awayTeam = awayTeamData?.teamsSub || "未定";
        
            let homeColor = homeTeamData?.teamsColor || "CCCCCC";
            let homeSubColor = homeTeamData?.teamsSubColor || "999999";
            let awayColor = awayTeamData?.teamsColor || "CCCCCC";
            let awaySubColor = awayTeamData?.teamsSubColor || "999999";
        
            let homeTextColor = getTextColor(homeColor);
            let awayTextColor = getTextColor(awayColor);
        
            let isSeedMatch = round === 0 && (matchDataTKey?.home?.teamId === null || matchDataTKey?.away?.teamId === null);
        
            let homeScore = matchDataTKey?.home?.score ?? "-";
            let awayScore = matchDataTKey?.away?.score ?? "-";
            let homePK = matchDataTKey?.home?.pk !== null ? `(${matchDataTKey?.home?.pk})` : "";
            let awayPK = matchDataTKey?.away?.pk !== null ? `(${matchDataTKey?.away?.pk})` : "";
            
            if (homeScore === awayScore && homeScore !== "-") {
                homeScore += homePK;
                awayScore += awayPK;
            }
        
            let homeRow = document.createElement("tr");
            let awayRow = document.createElement("tr");
        
            let winner = null;
            if (homeScore !== "-" && awayScore !== "-") {
                winner = homeScore > awayScore ? "home" : (homeScore < awayScore ? "away" : (matchDataTKey?.home?.pk > matchDataTKey?.away?.pk ? "home" : "away"));
            }
        
            let lineColor = winner ? "rgb(251, 0, 111)" : "white";
            let visibilityStyle = isSeedMatch ? "visibility: hidden;" : "";
        
            let line1Class = `line1-round${round}-match${match}`;
            let line2HomeClass = `line2home-round${round}-match${match}`;
            let line3HomeClass = `line3home-round${round}-match${match}`;
            let line2AwayClass = `line2away-round${round}-match${match}`;
            let line3AwayClass = `line3away-round${round}-match${match}`;
        
            homeRow.innerHTML = `
                <td class="tournament-cell" style="background: linear-gradient(to right, #${homeColor} 70%, #${homeSubColor} 90%);
                color: ${homeTextColor}; font-weight:bold; border: 1px solid ${winner === "home" ? lineColor : "white"}; ${visibilityStyle}">
                    ${homeTeam}
                </td>
                <td class="tournament-score" style="color: rgb(0, 0, 132); border: 1px solid ${winner === "home" ? lineColor : "white"}; background-color: ${winner === "home" ? lineColor : "white"}; ${visibilityStyle}">
                    ${homeScore}
                </td>
                <td class="${line1Class}" style="${visibilityStyle};background-color: ${winner === "home" ? lineColor : "white"};"></td>
                <td class="${line2HomeClass}" style="${visibilityStyle};background-color: ${winner === "home" ? lineColor : "white"};"></td>
                <td class="${line3HomeClass}" style="${visibilityStyle};background-color: ${winner === "home" ? lineColor : "white"}"></td>`;

            awayRow.innerHTML = `
                <td class="tournament-cell" style="background: linear-gradient(to right, #${awayColor} 70%, #${awaySubColor} 90%);
                color: ${awayTextColor}; font-weight:bold; border: 1px solid ${winner === "away" ? lineColor : "white"}; ${visibilityStyle}">
                    ${awayTeam}
                </td>
                <td class="tournament-score" style="color: rgb(0, 0, 132); border: 1px solid ${winner === "away" ? lineColor : "white"}; background-color: ${winner === "away" ? lineColor : "white"}; ${visibilityStyle}">
                    ${awayScore}
                </td>
                <td class="${line1Class}" style="${visibilityStyle};background-color: ${winner === "away" ? lineColor : "white"};"></td>
                <td class="${line2AwayClass}" style="${visibilityStyle};background-color: ${winner === "away" ? lineColor : "white"};"></td>
                <td class="${line3AwayClass}" style="${visibilityStyle};background-color: ${winner === "away" ? lineColor : "white"};"></td>`;

            cssStyles += `
                .${line1Class} {
                    width: ${lineWidth}px;
                    height: ${lineHeight}px;
                    background-color: white;
                    display: inline-block;
                    margin-top: ${(cellHeight - lineHeight) / 2}px;
                }
                .${line2HomeClass}, .${line2AwayClass} {
                    width: ${lineHeight}px;
                    height: ${verticalLineHeight}px;
                    background-color: white;
                    margin-top: ${-lineHeight}px;
                    margin-left: ${lineWidth}px;
                    position: absolute;
                }
                .${line3HomeClass}, .${line3AwayClass} {
                    width: ${lineWidth*2}px;
                    height: ${lineHeight/2}px;
                    background-color: white;
                    display: inline-block;
                    margin-left: ${lineWidth}px;
                    position: absolute;
                }
                .${line2AwayClass} {
                    margin-top: ${-verticalLineHeight-lineHeight}px;
                }
                .${line3HomeClass} {
                    margin-top: ${verticalLineHeight-lineHeight-lineHeight/2}px;
                }
                .${line3AwayClass} {
                    margin-top: ${-verticalLineHeight-lineHeight+lineHeight/2}px;
                }`;
            tbody.appendChild(homeRow);
            tbody.appendChild(awayRow);
        }
        container.appendChild(table);
    }

    // CSS を一括適用
    const style = document.createElement("style");
    style.innerHTML = cssStyles;
    document.head.appendChild(style);
}



///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// 個人戦績タブ
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
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

    if (!matchDataT[currentSeason]) return;

    let goalPlayers = {};
    let assistPlayers = {};

    // 各試合のデータを集計
    Object.keys(matchDataT[currentSeason]).forEach(matchKey => {
        if (matchKey === "teamsNum" || matchKey === "currentStandings"|| matchKey === "newDate") return; // 試合データ以外をスキップ
        
        let match = matchDataT[currentSeason][matchKey];

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
