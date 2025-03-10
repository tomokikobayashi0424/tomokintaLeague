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
// 各種データ表示の更新をまとめる関数
function updateAllDisplayData() {
    // 日程タブ
    displaySchedule();
    // トーナメント表タブ
    generateTournamentBracket();
    // 選手戦績タブ
    updatePlayerRecords('goalPlayersTable', 'goalPlayers');
    updatePlayerRecords('assistPlayersTable', 'assistPlayers');
    updatePlayerRecords('goalAssistPlayersTable', ['goalPlayers', 'assistPlayers']);
    toggleRecordTable();
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
    if (!matchDataTCoop[currentSeason]) return;

    let startDateStr = matchDataTCoop[currentSeason].newDate;
    let startDate = new Date(startDateStr);

    if (!schedule) {
        schedule = [];
        let numRounds = Math.ceil(Math.log2(matchDataTCoop[currentSeason].teamsNum));

        for (let round = 0; round < numRounds; round++) {
            let roundMatches = [];
            let roundStartDate = new Date(startDate);
            roundStartDate.setDate(startDate.getDate() + round * 7);

            let numMatches = Math.pow(2, numRounds - round - 1);
            if (round === numRounds - 1 && matchDataTCoop[currentSeason].teamsNum >= 4) {
                numMatches = 2;
            }

            for (let match = 0; match < numMatches; match++) {
                let matchKey = `round${round}-match${match}`;
                let matchDataTCoopEntry = matchDataTCoop[currentSeason][matchKey];
                // **非表示にせずプレースホルダーを設定**
                let matchDate = matchDataTCoopEntry?.date || roundStartDate.toISOString().split('T')[0];

                if (!matchDataTCoopEntry) {
                    console.warn(`試合データが見つかりません: ${matchKey}`);
                    continue;
                }

                // 複合チームのチーム名を取得
                let homeTeams = (matchDataTCoopEntry.home.teamId || [])
                    .map(teamId => {
                        let team = teamsData.find(team => team.teamId === teamId);
                        return team ? getTeamNameByScreenSize(team) : "不明";
                    })
                    .join("<br>");  // HTML内で改行

                let awayTeams = (matchDataTCoopEntry.away.teamId || [])
                    .map(teamId => {
                        let team = teamsData.find(team => team.teamId === teamId);
                        return team ? getTeamNameByScreenSize(team) : "不明";
                    })
                    .join("<br>");  // HTML内で改行

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
        let weekInfo = `第${i + 1}ラウンド ${roundStartDate.getFullYear()}年${roundStartDate.getMonth() + 1}月第${Math.ceil(roundStartDate.getDate() / 7)}週`;

        scheduleHTML += `<div class="round" id="round${i}" style="display: none;">`;
        scheduleHTML +=  `
            <div class="schedule-header sticky-header">
                <h2 class="week-info">${weekInfo}</h2>
                <div class="button-container">
                    <button class="button-common button3" onclick="previousRound()">＜　前ラウンド</button>
                    <button class="button-common button4" onclick="nextRound()">次ラウンド　＞</button>
                </div>
            </div>`;

        schedule[i].forEach((matchEntry, index) => {
            let matchKey = matchEntry.matchKey;  // 保存しておいたキーを取得
            let matchDataTCoopEntry = matchDataTCoop[currentSeason][matchKey];  // 正しい試合データを取得

            if (!matchDataTCoopEntry) {
                console.warn(`試合データが見つかりません: ${matchKey}`);
                return;
            }

            scheduleHTML += `
                <div class="match-container">
                    <table id="goalDetailsTable${i}-${index}" class="match-table">
                        <thead>
                            <tr>
                                <td colspan="5">日付: <input type="date" id="matchDate${i}-${index}" value="${matchEntry.date}"></td>
                            </tr>
                            <tr>
                                <th id="homeTeam${i}-${index}">${matchEntry.home}</th>
                                <th> <input type="number" id="homeScore${i}-${index}" min="0" placeholder="0" onchange="updateGoalDetails(${i}, ${index}, 'home')"></th>
                                <th> - </th>
                                <th> <input type="number" id="awayScore${i}-${index}" min="0" placeholder="0" onchange="updateGoalDetails(${i}, ${index}, 'away')"></th>
                                <th id="awayTeam${i}-${index}">${matchEntry.away}</th>
                            </tr>
                            <tr>
                                <td colspan="2"><label>PK</label> <input type="number" id="homePK${i}-${index}" min="0" placeholder="0"></td>
                                <td>PK戦</td>
                                <td colspan="2"><label>PK</label> <input type="number" id="awayPK${i}-${index}" min="0" placeholder="0"></td>
                            </tr>
                        </thead>
                        <tbody id="goalDetailsBody${i}-${index}"></tbody>
                    </table>`;

            const statsTableElement = generateStatsTable(i, index);
            scheduleHTML += statsTableElement.outerHTML;

            // matchDataLCoopEntry を正しく渡す
            scheduleHTML += generatePointTable(i, index, matchDataTCoopEntry).outerHTML;

            scheduleHTML += `
                    <div class="round-buttons">
                        <button class="button-score" onclick="completeScoreInput(${i}, ${index}, '${matchEntry.matchKey}')">第${i + 1}ラウンド 第${index + 1}試合 スコア入力完了</button>
                    </div>
                </div>`;
        });

        // scheduleHTML += `<button class="complete-round-btn" onclick="completeRound(${i})">今ラウンドのデータ入力完了</button>`;
        scheduleHTML += `</div>`;
    }

    document.getElementById('scheduleContent').innerHTML = scheduleHTML;

    for (let roundIndex = 0; roundIndex < schedule.length; roundIndex++) {
        for (let matchIndex = 0; matchIndex < schedule[roundIndex].length; matchIndex++) {
            loadmatchData(roundIndex, matchIndex, schedule[roundIndex][matchIndex].matchKey);
        }
    }

    // **現在のラウンドを計算**
    currentRound = calculateCurrentRound(startDate, schedule.length);
    showRound(0);
}

// 試合詳細のスタッツ表を生成する関数
function createStatsTable(statCategories, roundIndex, matchIndex) {
    const table = document.createElement('table');
    table.classList.add('stats-table'); // スタイルクラスを追加

    // 1行目に「ハーフタイム」「フルタイム」「空白」「ハーフタイム」「フルタイム」ヘッダを追加
    const headerRow = document.createElement('tr');

    // const homeHalfHeader = document.createElement('th');
    // homeHalfHeader.textContent = "ハーフタイム";
    
    const homeFullHeader = document.createElement('th');
    homeFullHeader.textContent = "フルタイム";

    const spacerHeader = document.createElement('th');
    spacerHeader.textContent = ""; // 空白のセル

    // const awayHalfHeader = document.createElement('th');
    // awayHalfHeader.textContent = "ハーフタイム";
    
    const awayFullHeader = document.createElement('th');
    awayFullHeader.textContent = "フルタイム";

    // headerRow.appendChild(homeHalfHeader);
    headerRow.appendChild(homeFullHeader);
    headerRow.appendChild(spacerHeader);
    // headerRow.appendChild(awayHalfHeader);
    headerRow.appendChild(awayFullHeader);

    table.appendChild(headerRow);

    // 2行目以降にスタッツ行を追加
    statCategories.forEach((category, index) => {
        const row = document.createElement('tr');

        // ホームチームのハーフタイム入力欄
        // const homeHalfInput = document.createElement('input');
        // homeHalfInput.type = "number";
        // homeHalfInput.id = `homeHalfStat${index}-${roundIndex}-${matchIndex}`;
        // homeHalfInput.placeholder = "0";
        // homeHalfInput.min = (index === 0) ? "0" : "0";  // 支配率なら0～100に制限
        // homeHalfInput.max = (index === 0) ? "100" : "";

        // ホームチームのフルタイム入力欄
        const homeFullInput = document.createElement('input');
        homeFullInput.type = "number";
        homeFullInput.id = `homeFullStat${index}-${roundIndex}-${matchIndex}`;
        homeFullInput.placeholder = "0";
        homeFullInput.min = (index === 0) ? "0" : "0";
        homeFullInput.max = (index === 0) ? "100" : "";

        // 真ん中列（データの説明）
        const categoryCell = document.createElement('td');
        categoryCell.textContent = category;

        // // アウェーチームのハーフタイム入力欄
        // const awayHalfInput = document.createElement('input');
        // awayHalfInput.type = "number";
        // awayHalfInput.id = `awayHalfStat${index}-${roundIndex}-${matchIndex}`;
        // awayHalfInput.placeholder = "0";
        // awayHalfInput.min = (index === 0) ? "0" : "0";
        // awayHalfInput.max = (index === 0) ? "100" : "";

        // アウェーチームのフルタイム入力欄
        const awayFullInput = document.createElement('input');
        awayFullInput.type = "number";
        awayFullInput.id = `awayFullStat${index}-${roundIndex}-${matchIndex}`;
        awayFullInput.placeholder = "0";
        awayFullInput.min = (index === 0) ? "0" : "0";
        awayFullInput.max = (index === 0) ? "100" : "";

        // 行にセルを追加
        // const homeHalfCell = document.createElement('td');
        // homeHalfCell.appendChild(homeHalfInput);
        
        const homeFullCell = document.createElement('td');
        homeFullCell.appendChild(homeFullInput);
        
        // const awayHalfCell = document.createElement('td');
        // awayHalfCell.appendChild(awayHalfInput);
        
        const awayFullCell = document.createElement('td');
        awayFullCell.appendChild(awayFullInput);

        // row.appendChild(homeHalfCell);
        row.appendChild(homeFullCell);
        row.appendChild(categoryCell);
        // row.appendChild(awayHalfCell);
        row.appendChild(awayFullCell);

        table.appendChild(row);
    });

    return table;
}

// ポイント表を表示する関数
function generatePointTable(roundIndex, matchIndex, matchData) {
    if (!matchData || !matchData.home || !matchData.away) {
        console.error(`試合データが不正です: round${roundIndex}-match${matchIndex}`, matchData);
        return document.createElement('div'); // エラー時に空の要素を返す
    }

    const homeTeamId = matchData.home.teamId || [];
    const awayTeamId = matchData.away.teamId || [];

    if (!Array.isArray(homeTeamId) || !Array.isArray(awayTeamId)) {
        console.error(`チームIDの配列が不正です: homeTeamId=${homeTeamId}, awayTeamId=${awayTeamId}`);
        return document.createElement('div'); // エラー時に空の要素を返す
    }

    return createPointTable(
        ["総合ポイント", "オフェンスポジショニング", "シュート", "デュエル", "ディフェンスポジショニング", "パス", "ドリブル"], 
        roundIndex, matchIndex, homeTeamId, awayTeamId
    );
}

// ポイント表を作成する関数
function createPointTable(pointCategories, roundIndex, matchIndex, homeTeamId = [], awayTeamId = []) {
    if (!Array.isArray(homeTeamId) || !Array.isArray(awayTeamId)) {
        console.error(`チームIDが配列でない: home=${homeTeamId}, away=${awayTeamId}`);
        return document.createElement('div'); // エラー時に空の要素を返す
    }

    const table = document.createElement('table');
    table.classList.add('points-table');

    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')); // 左上の空白セル

    // ホームチームのヘッダー
    homeTeamId.forEach((teamId) => {
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
    awayTeamId.forEach((teamId) => {
        const team = teamsData.find(t => t.teamId === teamId);
        const teamName = team ? getTeamNameByScreenSize(team) : "不明";
        const awayHeader = document.createElement('th');
        awayHeader.textContent = teamName;
        headerRow.appendChild(awayHeader);
    });

    table.appendChild(headerRow);

    // **各カテゴリごとの行（総合ポイントも手動入力）**
    pointCategories.forEach((category, statIndex) => {
        const row = document.createElement('tr');
        const categoryCell = document.createElement('td');
        categoryCell.textContent = category;
        row.appendChild(categoryCell);

        homeTeamId.forEach((_, index) => {
            const homeInput = document.createElement('input');
            homeInput.type = "number";
            homeInput.id = `homePoint${statIndex}-${index}-${roundIndex}-${matchIndex}`;
            homeInput.placeholder = "0";
            homeInput.min = "0";
            row.appendChild(document.createElement('td')).appendChild(homeInput);
        });

        row.appendChild(document.createElement('td')).textContent = "-";

        awayTeamId.forEach((_, index) => {
            const awayInput = document.createElement('input');
            awayInput.type = "number";
            awayInput.id = `awayPoint${statIndex}-${index}-${roundIndex}-${matchIndex}`;
            awayInput.placeholder = "0";
            awayInput.min = "0";
            row.appendChild(document.createElement('td')).appendChild(awayInput);
        });

        table.appendChild(row);
    });

    return table;
}

// 試合データを読み込む関数
function loadmatchData(roundIndex, matchIndex) {
    if (!matchDataTCoop[currentSeason]) return;

    let matchKey = `round${roundIndex}-match${matchIndex}`;
    let match = matchDataTCoop[currentSeason][matchKey];

    if (!match) {
        console.warn(`試合データが見つかりません: ${matchKey}`);
        return;
    }

    // console.log(`Loading match data for ${matchKey}`, match);

    // チームIDの取得（undefined の場合は空配列）
    let homeTeamId = Array.isArray(match.home?.teamId) ? match.home.teamId : [];
    let awayTeamId = Array.isArray(match.away?.teamId) ? match.away.teamId : [];

    // スコアとPKを表示
    document.getElementById(`homeScore${roundIndex}-${matchIndex}`).value = 
        match.home.score ?? '';

    document.getElementById(`awayScore${roundIndex}-${matchIndex}`).value = 
        match.away.score ?? '';

    document.getElementById(`homePK${roundIndex}-${matchIndex}`).value = 
        match.home.pk ?? '';

    document.getElementById(`awayPK${roundIndex}-${matchIndex}`).value = 
        match.away.pk ?? '';

    // スタッツデータの表示
    const statCategories = [
        "possession", "shots", "shotsonFrame", "fouls", "offsides",
        "cornerKicks", "freeKicks", "passes", "successfulPasses",
        "crosses", "PassCuts", "successfulTackles", "save"
    ];

    let homeFullTime = match.home?.fullTime || {}; // undefinedを防ぐ
    let awayFullTime = match.away?.fullTime || {}; // undefinedを防ぐ

    statCategories.forEach((category, index) => {
        let homeStatEl = document.getElementById(`homeFullStat${index}-${roundIndex}-${matchIndex}`);
        let awayStatEl = document.getElementById(`awayFullStat${index}-${roundIndex}-${matchIndex}`);

        if (homeStatEl) homeStatEl.value = homeFullTime[category] ?? '';
        if (awayStatEl) awayStatEl.value = awayFullTime[category] ?? '';
    });

    // pointsデータの読み込み
    const pointCategories = [
        "totalPoint", "OffensePositioning", "shot", "duel", 
        "defensePositioning", "pass", "dribble"
    ];

    let homePoints = match.home?.points || {}; // undefinedを防ぐ
    let awayPoints = match.away?.points || {}; // undefinedを防ぐ

    pointCategories.forEach((category, statIndex) => {
        homeTeamId.forEach((teamId, teamIndex) => {
            let homePointEl = document.getElementById(`homePoint${statIndex}-${teamIndex}-${roundIndex}-${matchIndex}`);
            if (homePointEl) {
                homePointEl.value = homePoints[category]?.[teamIndex] ?? '';
            }
        });

        awayTeamId.forEach((teamId, teamIndex) => {
            let awayPointEl = document.getElementById(`awayPoint${statIndex}-${teamIndex}-${roundIndex}-${matchIndex}`);
            if (awayPointEl) {
                awayPointEl.value = awayPoints[category]?.[teamIndex] ?? '';
            }
        });
    });

    // スコアに基づいて得点詳細行を表示
    updateGoalDetails(roundIndex, matchIndex, 'home', match.home);
    updateGoalDetails(roundIndex, matchIndex, 'away', match.away);
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
// トーナメント表を表示する関数
function generateTournamentBracket() {
    if (!matchDataTCoop[currentSeason]) return;

    let container = document.getElementById("tournament-coop-container");
    container.innerHTML = "";

    let cellHeight = 60; // セルの高さ
    let spacingUnit = 5; // セル間の間隔
    let lineWidth = 10; // 横棒の長さ
    let lineHeight = 2; // 棒の太さ

    let cssStyles = ""; 

    let numRounds = Math.ceil(Math.log2(matchDataTCoop[currentSeason].teamsNum));
    let maxContainerWidth = Math.min(window.innerWidth, numRounds * 116);
    container.style.maxWidth = `${maxContainerWidth}px`;
    container.style.overflowX = "auto";
    for (let round = 0; round < numRounds; round++) {
        let numMatches = Math.pow(2, numRounds - round - 1);
        let table = document.createElement("table");
        table.classList.add("tournament-coop-table");
        let tbody = document.createElement("tbody");
        table.appendChild(tbody);

        let offset = (cellHeight + spacingUnit) * (Math.pow(2, round - 1) - 0.5);
        table.style.marginTop = offset > 0 ? `${-offset}px` : "0px";

        let spacing = cellHeight * (Math.pow(2, round) - 1) + spacingUnit * Math.pow(2, round);
        let verticalLineHeight = (cellHeight + spacing) / 2;
        table.style.borderSpacing = `0 ${spacing}px`;

        for (let match = 0; match < numMatches; match++) {
            let matchKey = `round${round}-match${match}`;
            let matchDataTKey = matchDataTCoop[currentSeason][matchKey] || {};

            // チームIDの配列に対応したデータ取得
            let homeTeamData = (matchDataTKey?.home?.teamId || []).map(teamId => teamsData.find(team => team.teamId === teamId) || {});
            let awayTeamData = (matchDataTKey?.away?.teamId || []).map(teamId => teamsData.find(team => team.teamId === teamId) || {});

            // チーム名のリストを取得し、改行で表示
            let homeTeam = homeTeamData.map(team => team.teamsSub || "未定").join("<br>");
            let awayTeam = awayTeamData.map(team => team.teamsSub || "未定").join("<br>");

            // チームの色を配列で取得
            let homeColor = homeTeamData.map(team => team.teamsColor || "CCCCCC");
            let homeSubColor = homeTeamData.map(team => team.teamsSubColor || "999999");
            let awayColor = awayTeamData.map(team => team.teamsColor || "CCCCCC");
            let awaySubColor = awayTeamData.map(team => team.teamsSubColor || "999999");
            console.log("Home Colors:", homeColor);
console.log("Away Colors:", awayColor);

            // テキストカラーも配列で取得
            let homeTextColor = homeColor.map(color => getTextColor(color));
            let awayTextColor = awayColor.map(color => getTextColor(color));
            console.log("Home Text Colors:", homeTextColor);
console.log("Away Text Colors:", awayTextColor);


            // シードマッチの判定
            let isSeedMatch = round === 0 && (matchDataTKey?.home?.teamId?.length === 0 || matchDataTKey?.away?.teamId?.length === 0);

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

            let lineColor = winner ? "rgb(251, 0, 111); " : "white";
            
            let visibilityStyle = isSeedMatch ? "visibility: hidden;" : "";

            let line1Class = `line1-round${round}-match${match}`;
            let line2HomeClass = `line2home-round${round}-match${match}`;
            let line3HomeClass = `line3home-round${round}-match${match}`;
            let line2AwayClass = `line2away-round${round}-match${match}`;
            let line3AwayClass = `line3away-round${round}-match${match}`;

            // **innerHTMLで改行 (`<br>`) を適用**
            homeRow.innerHTML = `
    <td class="tournament-coop-cell" style="
        ${homeColor.length > 0 ? 
        `background: linear-gradient(to bottom, ${homeColor.map((color, index) => 
            `#${color} ${(index / homeColor.length) * 100}%, #${color} ${((index + 1) / homeColor.length) * 100}%`
        ).join(', ')});` 
        : `background-color: #000000;`} 
        font-weight:bold; 
        border: 1px solid ${winner === "home" ? lineColor : "white"}; 
        ${visibilityStyle}">
        ${homeTeamData.map((team, index) => 
            `<span style="color: #${homeTextColor[index]}; display: block;">${team.teamsSub || "未定"}</span>`
        ).join('')}
    </td>
    <td class="tournament-coop-score" style="color: rgb(0, 0, 132); border: 1px solid ${winner === "home" ? lineColor : "white"}; background-color: ${winner === "home" ? lineColor : "white"}; ${visibilityStyle}">
        ${homeScore}
    </td>
    <td class="${line1Class}" style="${visibilityStyle};background-color: ${winner === "home" ? lineColor : "white"};"></td>
    <td class="${line2HomeClass}" style="${visibilityStyle};background-color: ${winner === "home" ? lineColor : "white"};"></td>
    <td class="${line3HomeClass}" style="${visibilityStyle};background-color: ${winner === "home" ? lineColor : "white"}; z-index: ${winner === "home" ? 2 : 1};"></td>`;

awayRow.innerHTML = `
    <td class="tournament-coop-cell" style="
        ${awayColor.length > 0 ? 
        `background: linear-gradient(to bottom, ${awayColor.map((color, index) => 
            `#${color} ${(index / awayColor.length) * 100}%, #${color} ${((index + 1) / awayColor.length) * 100}%`
        ).join(', ')});` 
        : `background-color: #000000;`} 
        font-weight:bold; 
        border: 1px solid ${winner === "away" ? lineColor : "white"}; 
        ${visibilityStyle}">
        ${awayTeamData.map((team, index) => 
            `<span style="color: #${awayTextColor[index]}; display: block;">${team.teamsSub || "未定"}</span>`
        ).join('')}
    </td>
    <td class="tournament-coop-score" style="color: rgb(0, 0, 132); border: 1px solid ${winner === "away" ? lineColor : "white"}; background-color: ${winner === "away" ? lineColor : "white"}; ${visibilityStyle}">
        ${awayScore}
    </td>
    <td class="${line1Class}" style="${visibilityStyle};background-color: ${winner === "away" ? lineColor : "white"};"></td>
    <td class="${line2AwayClass}" style="${visibilityStyle};background-color: ${winner === "away" ? lineColor : "white"};"></td>
    <td class="${line3AwayClass}" style="${visibilityStyle};background-color: ${winner === "away" ? lineColor : "white"}; z-index: ${winner === "away" ? 2 : 1};"></td>`;

            cssStyles += `
                .${line1Class} {
                    width: ${lineWidth}px;
                    height: ${lineHeight}px;
                    background-color: white;
                    display: inline-block;
                    margin-top: ${cellHeight / 2 - lineHeight*2}px;
                }
                .${line2HomeClass}, .${line2AwayClass} {
                    width: ${lineHeight}px;
                    height: ${verticalLineHeight}px;
                    background-color: white;
                    margin-top: ${-2*lineHeight}px;
                    margin-left: ${lineWidth}px;
                    position: absolute;
                }
                .${line3HomeClass}, .${line3AwayClass} {
                    width: ${lineWidth*2}px;
                    height: ${lineHeight}px;
                    background-color: white;
                    display: inline-block;
                    margin-left: ${lineWidth}px;
                    position: absolute;
                    
                }
                .${line2AwayClass} {
                    margin-top: ${-verticalLineHeight-lineHeight*1}px;
                }
                .${line3HomeClass} {
                    margin-top: ${verticalLineHeight-lineHeight}px;
                }
                .${line3AwayClass} {
                    margin-top: ${-verticalLineHeight-lineHeight}px;
                }`;
            tbody.appendChild(homeRow);
            tbody.appendChild(awayRow);
        }
        container.appendChild(table);
    }

    const style = document.createElement("style");
    style.innerHTML = cssStyles;
    document.head.appendChild(style);
}