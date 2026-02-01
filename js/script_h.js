// 各種データ表示の更新をまとめる関数
function updateAllDisplayData() {
    // 日程タブ
    // displaySchedule(); 
    // 順位タブ
    // updateRankChangeArrows();
    // 選手戦績タブ
    // updatePlayerRecords('goalPlayersTable', 'goalPlayers');
    // updatePlayerRecords('assistPlayersTable', 'assistPlayers');
    // updatePlayerRecords('goalAssistPlayersTable', ['goalPlayers', 'assistPlayers']);
    // updatePlayerRecordsWithTeam('goalTeamsTable', ['goalPlayers']);
    // updatePlayerRecordsWithTeam('assistTeamsTable', ['assistPlayers']);
    // updatePlayerRecordsWithTeam('totalPlayersTable', ['goalPlayers', 'assistPlayers']);
    // toggleRecordTable();
    
}


///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// チームスタッツ
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
function updateTeamStatsSeasonDropdown() {
    const seasonSelect = document.getElementById("teamStatsSeasonSelect");
    seasonSelect.innerHTML = '';

    // 対象：Tomokinta League（Lリーグ）の全シーズンを取得
    let lSeasons = Object.keys(matchDataL);

    if (lSeasons.length === 0) {
        lSeasons = ["24-s1"];
        matchDataL["24-s1"] = {};
        localStorage.setItem('matchDataL', JSON.stringify(matchDataL));
    }

    // `-sX`のXで降順ソート（例：s3, s2, s1）
    lSeasons.sort((a, b) => {
        const getSeasonNumber = (key) => {
            const match = key.match(/-s(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        };
        return getSeasonNumber(b) - getSeasonNumber(a);
    });

    // 「全体合計」オプションを追加
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "全体合計";
    seasonSelect.appendChild(allOption);

    // 各シーズンのオプションを追加
    lSeasons.forEach(season => {
        const option = document.createElement("option");
        option.value = season;
        option.textContent = season;
        // デフォルト選択（最初の個別シーズン）
        if (season === lSeasons[0]) {
            option.selected = true;
            window.displaySeason2 = season; // 初期選択値をセット
        }
        seasonSelect.appendChild(option);
    });
}

function handleSeasonChange() {
    const selectedSeason = document.getElementById("teamStatsSeasonSelect").value;
    window.displaySeason2 = selectedSeason;

    const teamId = parseInt(document.getElementById('teamNameHeader').getAttribute('data-team-id'));
    displayTeamMonthlySchedule(teamId);
    calculateTeamAndOpponentStats(teamId);
}

// チームスタッツを開く関数
function openTabWithTeam(evt, tabName, teamIndex) {
    // タブの切り替え
    openTab(evt, tabName);

    // クリックしたロゴに対応するチーム名を取得
    const team = teamsData.find(t => t.teamId === teamIndex);
    if (team) {
        const teamName = team.teams || `Team ${teamIndex + 1}`;
        const teamColor = team.teamsColor || 'FFFFFF'; // デフォルト背景色：白
        const teamSubColor = team.teamsSubColor || '000000'; // デフォルト文字色：黒
        // const teamTextColor = team.teamsTextColor || '000000'; // デフォルト背景色：白
        const teamBgColor = team.teamsBgColor || 'FFFFFF'; // デフォルト文字色：黒
        // let teamColor2 = teamInfo ? `#${teamInfo.teamsColor}` : "#FFFFFF"; // デフォルト白
        let textColor = getTextColor(teamColor);

        // CSS変数を更新
        document.documentElement.style.setProperty('--team-color-1', `#${teamColor}`);
        document.documentElement.style.setProperty('--teamsub-color-1', `#${teamSubColor}`);
        document.documentElement.style.setProperty('--teamtext-color-1', `#000000`);
        document.documentElement.style.setProperty('--teambg-color-1', `#${teamBgColor}`);
        document.documentElement.style.setProperty('--teamhead-color-1', `#${textColor}`);

        // タブのタイトルにチーム名を設定
        const teamHeader = document.getElementById('teamNameHeader');
        teamHeader.textContent = teamName;
        teamHeader.setAttribute('data-team-id', teamIndex);

        // 初回に現在の月のスケジュールを表示
        // currentMonthOffset = 0;
        // チーム日程を表示
        displayTeamMonthlySchedule(teamIndex);
        updateTeamStatsSeasonDropdown();
        // toggleSeasonView();
        // チーム戦績を表示
        calculateTeamAndOpponentStats(teamIndex); 
    }
}

// チームスタッツを閉じる関数
function closeTeamPerformanceTab() {
    document.getElementById('teamPerformanceTab').style.display = 'none';
    openTab(null, "home-schedule"); // ホームタブをアクティブにする
}

// 前の月を表示
function previousMonth() {
    currentMonthOffset--;
    const teamId = parseInt(document.getElementById('teamNameHeader').getAttribute('data-team-id'));
    displayTeamMonthlySchedule(teamId);
}

// 次の月を表示
function nextMonth() {
    currentMonthOffset++;
    const teamId = parseInt(document.getElementById('teamNameHeader').getAttribute('data-team-id'));
    displayTeamMonthlySchedule(teamId);
}

// シーズン選択
// function toggleSeasonView() {
//     // let leagueSelect = document.getElementById("leagueSelect");

//     displaySeason = (displaySeason === "current") ? "all" : "current";

//     let seasonText = document.getElementById("seasonDisplayText");
//     seasonText.textContent = (displaySeason === "all") ? "All" : `${currentSeason}`;

//     // **表示データを更新**
//     let teamIndex = document.getElementById('teamNameHeader').getAttribute('data-team-id');
//     displayTeamMonthlySchedule(parseInt(teamIndex));
//     // **チーム戦績を表示**
//     calculateTeamAndOpponentStats(parseInt(teamIndex));
// }


// チーム日程表の表示
function displayTeamMonthlySchedule(teamId) {
    let scheduleHTML = '';
    let allMatches = [];

    let displayMonth = new Date();
    displayMonth.setDate(1);
    displayMonth.setMonth(displayMonth.getMonth() + currentMonthOffset);
    const displayYear = displayMonth.getFullYear();
    const displayMonthIndex = displayMonth.getMonth();

    // Process L, T, C seasons separately to avoid missing L/T when only C seasons exist
    const lSeasons = Object.keys(matchDataL || {});
    const tSeasons = Object.keys(matchDataT || {});
    const lcSeasons = Object.keys(matchDataLCoop || {});

    const processSeason = (matchData, type, season, startDate, roundDates = null) => {
        const matchType = type === 'L' ? 'リーグ戦' : (type === 'T' ? 'トーナメント' : 'チーム戦');

        if (!matchData) return;

        for (const matchKey in matchData) {
            if (["teamsNum", "currentStandings", "newDate"].includes(matchKey)) continue;

            const match = matchData[matchKey];
            if (!match) continue;

            const roundNumber = type === 'L' ? matchKey.split('-')[0] : matchKey.match(/round(\d+)/)?.[1];

            let matchDate;
            if (match.date) {
                matchDate = new Date(match.date);
            } else {
                matchDate = new Date(startDate);
                if (type === 'T' || type === 'C') {
                    if (roundNumber) {
                        matchDate.setDate(startDate.getDate() + parseInt(roundNumber, 10) * 7);
                    }
                } else if (type === 'L') {
                    matchDate = (roundDates && roundDates[roundNumber]) ? roundDates[roundNumber] : matchDate;
                }
            }

            if (matchDate.getFullYear() !== displayYear || matchDate.getMonth() !== displayMonthIndex) continue;

            let isHome = false;
            let isAway = false;
            let opponentTeamNames = "";

            if (type === 'C') {
                const homeIds = Array.isArray(match.home && match.home.teamIds) ? match.home.teamIds : (Array.isArray(match.teamIdsHome) ? match.teamIdsHome : null);
                const awayIds = Array.isArray(match.away && match.away.teamIds) ? match.away.teamIds : (Array.isArray(match.teamIdsAway) ? match.teamIdsAway : null);

                isHome = Array.isArray(homeIds) && homeIds.includes(teamId);
                isAway = Array.isArray(awayIds) && awayIds.includes(teamId);

                if (isHome || isAway) {
                    const opponents = isHome ? awayIds : homeIds;
                    if (Array.isArray(opponents)) {
                        opponentTeamNames = opponents
                            .map(opponentId => {
                                const team = teamsData.find(team => team.teamId === opponentId);
                                return team ? team.teams : null;
                            })
                            .filter(name => name !== null)
                            .join("<br>");
                    }
                }
            } else {
                const homeTeamId = match.home ? (('teamId' in match.home) ? match.home.teamId : (('team' in match.home) ? match.home.team : null)) : null;
                const awayTeamId = match.away ? (('teamId' in match.away) ? match.away.teamId : (('team' in match.away) ? match.away.team : null)) : null;

                isHome = homeTeamId !== null && homeTeamId === teamId;
                isAway = awayTeamId !== null && awayTeamId === teamId;

                if (isHome || isAway) {
                    const opponentId = isHome ? awayTeamId : homeTeamId;
                    const opponentTeam = teamsData.find(team => team.teamId === opponentId);
                    opponentTeamNames = opponentTeam ? opponentTeam.teams : null;
                }
            }

            if (!isHome && !isAway) continue;
            if (!opponentTeamNames) continue;

            let scoreClass = '';
            if (isHome && match.home.score != null && match.away.score != null) {
                if (match.home.score > match.away.score) scoreClass = 'highlight-green';
                else if (match.home.score < match.away.score) scoreClass = 'highlight-red';
            } else if (isAway && match.home.score != null && match.away.score != null) {
                if (match.away.score > match.home.score) scoreClass = 'highlight-green';
                else if (match.away.score < match.home.score) scoreClass = 'highlight-red';
            }

            allMatches.push({
                matchDate,
                season,
                matchType,
                location: isHome ? 'home' : 'away',
                opponent: opponentTeamNames,
                score: `${match.home.score ?? '-'} - ${match.away.score ?? '-'}`,
                scoreClass
            });
        }
    };

    // Process L seasons
    lSeasons.forEach(season => {
        const startDate = new Date(matchDataL[season]?.newDate || new Date());
        let roundDates = {};
        let rounds = 0;

        const md = matchDataL[season];
        if (md) {
            for (const matchKey in md) {
                if (matchKey.startsWith('round')) {
                    const roundNumber = parseInt(matchKey.match(/round(\d+)/)?.[1], 10);
                    if (!isNaN(roundNumber)) rounds = Math.max(rounds, roundNumber);
                }
            }
            for (let i = 0; i <= rounds; i++) {
                roundDates[`round${i}`] = new Date(startDate);
                roundDates[`round${i}`].setDate(startDate.getDate() + i * 7);
            }
        }
        processSeason(md, 'L', season, startDate, roundDates);
    });

    // Process T seasons
    tSeasons.forEach(season => {
        const startDate = new Date(matchDataT[season]?.newDate || new Date());
        processSeason(matchDataT[season], 'T', season, startDate, null);
    });

    // Process C (coop) seasons
    lcSeasons.forEach(season => {
        const startDate = new Date(matchDataLCoop[season]?.newDate || new Date());
        processSeason(matchDataLCoop[season], 'C', season, startDate, null);
    });

    allMatches.sort((a, b) => a.matchDate - b.matchDate);

    allMatches.forEach(match => {
        scheduleHTML += `
            <tr>
                <td>${match.matchDate.getDate()}日</td>
                <td>${match.season}</td>
                <td>${match.location}</td>
                <td>${match.opponent}</td>
                <td class="${match.scoreClass}">${match.score}</td>
            </tr>
        `;
    });

    if (scheduleHTML === '') {
        scheduleHTML = `<tr><td colspan="6">この月の試合はありません</td></tr>`;
    }

    document.getElementById('teamScheduleTableBody').innerHTML = scheduleHTML;
    document.getElementById('currentMonthLabel').textContent = `${displayYear}年${displayMonthIndex + 1}月`;
}


// チームごとのプレイヤーランキングを表示する関数
function displayTeamPlayerRanking(tableId, players) {
    let sortedPlayers = Object.entries(players).sort((a, b) => b[1] - a[1]); // 得点順にソート
    let tbody = document.querySelector(`#${tableId} tbody`);
    
    if (!tbody) {
        console.error(`テーブルID ${tableId} が見つかりませんでした`);
        return;
    }

    tbody.innerHTML = '';  // テーブルを初期化

    let rank = 1;  // 順位
    let prevScore = null;  // 前のスコア
    let displayRank = rank; // 表示する順位

    sortedPlayers.forEach(([player, count], index) => {
        // 前のスコアと異なる場合は表示する順位を更新
        if (prevScore !== count) {
            displayRank = rank;  // 表示する順位を設定
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

// 全チームの統計データを集計する関数
function calculateOverallTeamStats() {
    let overallStats = {
        matches: 0,
        wins: 0,
        goals: 0,
        goalsWithPossession: 0,
        draws: 0,
        losses: 0,
        possession: 0,
        possessionMatches: 0,
        shots: 0,
        shotsonFrame: 0,
        shotsonFrameRate: 0,
        fouls: 0,
        offsides: 0,
        cornerKicks: 0,
        freeKicks: 0,
        passes: 0,
        successfulPasses: 0,
        passSuccessRate: 0,
        crosses: 0,
        PassCuts: 0,
        successfulTackles: 0,
        save: 0
    };

    // **すべてのシーズンの試合を集計**
    // let targetSeasons = Object.keys(matchDataL); // すべてのシーズンを取得
    let targetSeasons = (displaySeason2 === "all") ? Object.keys(matchDataL) : [displaySeason2];

    targetSeasons.forEach(season => {
        if (!matchDataL[season]) return; // データがないシーズンはスキップ

        for (const matchKey in matchDataL[season]) {
            // `teamsNum` や `currentStandings` をスキップ
            if (matchKey === "teamsNum" || matchKey === "currentStandings"|| matchKey === "newDate") continue;

            const match = matchDataL[season][matchKey];

            // `match` が `undefined` の場合はスキップ
            if (!match || !match.home || !match.away) continue;

            // スコアが未入力の試合を無視
            const homeScore = match.home.score;
            const awayScore = match.away.score;
            if (homeScore === null || awayScore === null) continue;

            overallStats.matches += 2; // 両チーム分カウント

            overallStats.goals += homeScore + awayScore;
            // accumulate per-team stats only when possession is present for that side
            const hPos = match.home.fullTime?.possession;
            if (typeof hPos === 'number') {
                overallStats.possession += hPos;
                overallStats.possessionMatches++;
                overallStats.goalsWithPossession += match.home.score || 0;
                overallStats.shots += match.home.fullTime?.shots || 0;
                overallStats.shotsonFrame += match.home.fullTime?.shotsonFrame || 0;
                overallStats.fouls += match.home.fullTime?.fouls || 0;
                overallStats.offsides += match.home.fullTime?.offsides || 0;
                overallStats.cornerKicks += match.home.fullTime?.cornerKicks || 0;
                overallStats.freeKicks += match.home.fullTime?.freeKicks || 0;
                overallStats.passes += match.home.fullTime?.passes || 0;
                overallStats.successfulPasses += match.home.fullTime?.successfulPasses || 0;
                overallStats.crosses += match.home.fullTime?.crosses || 0;
                overallStats.PassCuts += match.home.fullTime?.PassCuts || 0;
                overallStats.successfulTackles += match.home.fullTime?.successfulTackles || 0;
                overallStats.save += match.home.fullTime?.save || 0;
            }
            const aPos = match.away.fullTime?.possession;
            if (typeof aPos === 'number') {
                overallStats.possession += aPos;
                overallStats.possessionMatches++;
                overallStats.goalsWithPossession += match.away.score || 0;
                overallStats.shots += match.away.fullTime?.shots || 0;
                overallStats.shotsonFrame += match.away.fullTime?.shotsonFrame || 0;
                overallStats.fouls += match.away.fullTime?.fouls || 0;
                overallStats.offsides += match.away.fullTime?.offsides || 0;
                overallStats.cornerKicks += match.away.fullTime?.cornerKicks || 0;
                overallStats.freeKicks += match.away.fullTime?.freeKicks || 0;
                overallStats.passes += match.away.fullTime?.passes || 0;
                overallStats.successfulPasses += match.away.fullTime?.successfulPasses || 0;
                overallStats.crosses += match.away.fullTime?.crosses || 0;
                overallStats.PassCuts += match.away.fullTime?.PassCuts || 0;
                overallStats.successfulTackles += match.away.fullTime?.successfulTackles || 0;
                overallStats.save += match.away.fullTime?.save || 0;
            }

            if (homeScore > awayScore) {
                overallStats.wins++;
                overallStats.losses++;
            } else if (homeScore === awayScore) {
                overallStats.draws += 2;
            } else {
                overallStats.wins++;
                overallStats.losses++;
            }
        }
    });
    console.log("総合スタッツ:", overallStats);
    return overallStats;
}

// 特定のチームの統計データを集計する関数
function calculateTeamAndOpponentStats(teamId) {
    let stats = {
        team: {
            matches: 0,
            wins: 0,
            goals: 0,
            goalsWithPossession: 0,
            draws: 0,
            losses: 0,
            possession: 0,
            possessionMatches: 0,
            shots: 0,
            shotsonFrame: 0,
            shotsonFrameRate: 0,
            fouls: 0,
            offsides: 0,
            cornerKicks: 0,
            freeKicks: 0,
            passes: 0,
            successfulPasses: 0,
            passSuccessRate: 0,
            crosses: 0,
            PassCuts: 0,
            successfulTackles: 0,
            save: 0,
        },
        opponent: {
            matches: 0,
            goals: 0,
            goalsWithPossession: 0,
            possession: 0,
            possessionMatches: 0,
            shots: 0,
            shotsonFrame: 0,
            fouls: 0,
            offsides: 0,
            cornerKicks: 0,
            freeKicks: 0,
            passes: 0,
            successfulPasses: 0,
            passSuccessRate: 0,
            crosses: 0,
            PassCuts: 0,
            successfulTackles: 0,
            save: 0,
        },
    };

    let goalPlayers = {};
    let assistPlayers = {};

    // **すべてのシーズンの試合を集計**
    // let targetSeasons = Object.keys(matchDataL); // すべてのシーズンを取得
    let targetSeasons = (displaySeason2 === "all") ? Object.keys(matchDataL) : [displaySeason2];


    targetSeasons.forEach(season => {
        if (!matchDataL[season]) return; // データがないシーズンはスキップ

        for (const matchKey in matchDataL[season]) {

            if (matchKey === "teamsNum" || matchKey === "currentStandings"|| matchKey === "newDate") continue;
            
            const match = matchDataL[season][matchKey];
            // `match` が `undefined` の場合はスキップ
            if (!match || !match.home || !match.away) continue;
            const isHome = match.home.teamId === teamId;
            const isAway = match.away.teamId === teamId;

            // スコアが未入力の試合を無視
            const homeScore = match.home.score;
            const awayScore = match.away.score;
            if (homeScore === null || awayScore === null) continue;

            if (isHome || isAway) {
                // 自チームの統計を集計
                const team = isHome ? match.home : match.away;
                const opponent = isHome ? match.away : match.home;

                stats.team.matches++;
                stats.team.goals += team.score || 0;
                // only aggregate possession-related stats when possession is present
                const tPos = team.fullTime?.possession;
                if (typeof tPos === 'number') {
                    stats.team.possession += tPos;
                    stats.team.possessionMatches++;
                    stats.team.goalsWithPossession += team.score || 0;
                    stats.team.shots += team.fullTime?.shots || 0;
                    stats.team.shotsonFrame += team.fullTime?.shotsonFrame || 0;
                    stats.team.fouls += team.fullTime?.fouls || 0;
                    stats.team.offsides += team.fullTime?.offsides || 0;
                    stats.team.cornerKicks += team.fullTime?.cornerKicks || 0;
                    stats.team.freeKicks += team.fullTime?.freeKicks || 0;
                    stats.team.passes += team.fullTime?.passes || 0;
                    stats.team.successfulPasses += team.fullTime?.successfulPasses || 0;
                    stats.team.crosses += team.fullTime?.crosses || 0;
                    stats.team.PassCuts += team.fullTime?.PassCuts || 0;
                    stats.team.successfulTackles += team.fullTime?.successfulTackles || 0;
                    stats.team.save += team.fullTime?.save || 0;
                }

                // ゴールとアシストのプレイヤーを集計
                const goalPlayersArray = team.goalPlayers || [];
                const assistPlayersArray = team.assistPlayers || [];

                if (Array.isArray(goalPlayersArray)) {
                    goalPlayersArray.forEach(player => {
                        if (player) {
                            goalPlayers[player] = (goalPlayers[player] || 0) + 1;
                        }
                    });
                }

                if (Array.isArray(assistPlayersArray)) {
                    assistPlayersArray.forEach(player => {
                        if (player) {
                            assistPlayers[player] = (assistPlayers[player] || 0) + 1;
                        }
                    });
                }

                // 勝敗を計算
                if ((isHome && homeScore > awayScore) || (isAway && awayScore > homeScore)) {
                    stats.team.wins++;
                } else if (homeScore === awayScore) {
                    stats.team.draws++;
                } else {
                    stats.team.losses++;
                }

                // 対戦相手の統計を集計
                stats.opponent.matches++;
                stats.opponent.goals += opponent.score || 0;
                const oPos = opponent.fullTime?.possession;
                if (typeof oPos === 'number') {
                    stats.opponent.possession += oPos;
                    stats.opponent.possessionMatches++;
                    stats.opponent.goalsWithPossession += opponent.score || 0;
                    stats.opponent.shots += opponent.fullTime?.shots || 0;
                    stats.opponent.shotsonFrame += opponent.fullTime?.shotsonFrame || 0;
                    stats.opponent.fouls += opponent.fullTime?.fouls || 0;
                    stats.opponent.offsides += opponent.fullTime?.offsides || 0;
                    stats.opponent.cornerKicks += opponent.fullTime?.cornerKicks || 0;
                    stats.opponent.freeKicks += opponent.fullTime?.freeKicks || 0;
                    stats.opponent.passes += opponent.fullTime?.passes || 0;
                    stats.opponent.successfulPasses += opponent.fullTime?.successfulPasses || 0;
                    stats.opponent.crosses += opponent.fullTime?.crosses || 0;
                    stats.opponent.PassCuts += opponent.fullTime?.PassCuts || 0;
                    stats.opponent.successfulTackles += opponent.fullTime?.successfulTackles || 0;
                    stats.opponent.save += opponent.fullTime?.save || 0;
                }
            }
        }
    });


    // 自チームの戦績データを表示
    document.getElementById('matches-team').textContent = stats.team.matches;
    document.getElementById('wins-team-total').textContent = stats.team.wins;
    document.getElementById('draws-team-total').textContent = stats.team.draws;
    document.getElementById('losses-team-total').textContent = stats.team.losses;
    document.getElementById('wins-team-per').textContent = (stats.team.wins*100 / stats.team.matches).toFixed(2) + '%';
    document.getElementById('draws-team-per').textContent = (stats.team.draws*100 / stats.team.matches).toFixed(2) + '%';
    document.getElementById('losses-team-per').textContent = (stats.team.losses*100 / stats.team.matches).toFixed(2) + '%';
    
    document.getElementById('goals-team-total').textContent = stats.team.goals;
    document.getElementById('goals-team-avg').textContent = (stats.team.goals / stats.team.matches).toFixed(2);

    document.getElementById('possession-team').textContent = (stats.team.possessionMatches > 0) ? (stats.team.possession / stats.team.possessionMatches).toFixed(2) + '%' : '-';

    document.getElementById('shots-team-total').textContent = stats.team.shots;
    document.getElementById('shots-team-avg').textContent = (stats.team.possessionMatches > 0) ? (stats.team.shots / stats.team.possessionMatches).toFixed(2) : '-';
    document.getElementById('shotsonFrame-team-total').textContent = stats.team.shotsonFrame;
    document.getElementById('shotsonFrame-team-avg').textContent = (stats.team.possessionMatches > 0) ? (stats.team.shotsonFrame / stats.team.possessionMatches).toFixed(2) : '-';
    document.getElementById('shotsonFrame-team-per').textContent = (stats.team.shots > 0) ? (stats.team.shotsonFrame*100 / stats.team.shots).toFixed(2) + '%' : '-';
    document.getElementById('goals-team-per').textContent = (stats.team.shots > 0) ? (stats.team.goalsWithPossession*100 / stats.team.shots).toFixed(2) + '%' : '-';
    
    document.getElementById('fouls-team-total').textContent = stats.team.fouls;
    document.getElementById('fouls-team-avg').textContent = (stats.team.possessionMatches > 0) ? (stats.team.fouls / stats.team.possessionMatches).toFixed(2) : '-';
    document.getElementById('offsides-team-total').textContent = stats.team.offsides;
    document.getElementById('offsides-team-avg').textContent = (stats.team.possessionMatches > 0) ? (stats.team.offsides / stats.team.possessionMatches).toFixed(2) : '-';
    document.getElementById('cornerKicks-team-total').textContent = stats.team.cornerKicks;
    document.getElementById('cornerKicks-team-avg').textContent = (stats.team.possessionMatches > 0) ? (stats.team.cornerKicks / stats.team.possessionMatches).toFixed(2) : '-';
    document.getElementById('freeKicks-team-total').textContent = stats.team.freeKicks;
    document.getElementById('freeKicks-team-avg').textContent = (stats.team.possessionMatches > 0) ? (stats.team.freeKicks / stats.team.possessionMatches).toFixed(2) : '-';
    document.getElementById('passes-team-total').textContent = stats.team.passes;
    document.getElementById('passes-team-avg').textContent = (stats.team.possessionMatches > 0) ? (stats.team.passes / stats.team.possessionMatches).toFixed(2) : '-';
    document.getElementById('successfulPasses-team-total').textContent = stats.team.successfulPasses;
    document.getElementById('successfulPasses-team-avg').textContent = (stats.team.possessionMatches > 0) ? (stats.team.successfulPasses / stats.team.possessionMatches).toFixed(2) : '-';
    document.getElementById('successfulPasses-team-per').textContent = (stats.team.passes > 0) ? (stats.team.successfulPasses*100 / stats.team.passes).toFixed(2) + '%' : '-';
    document.getElementById('crosses-team-total').textContent = stats.team.crosses;
    document.getElementById('crosses-team-avg').textContent = (stats.team.possessionMatches > 0) ? (stats.team.crosses / stats.team.possessionMatches).toFixed(2) : '-';
    document.getElementById('PassCuts-team-total').textContent = stats.team.PassCuts;
    document.getElementById('PassCuts-team-avg').textContent = (stats.team.possessionMatches > 0) ? (stats.team.PassCuts / stats.team.possessionMatches).toFixed(2) : '-';
    document.getElementById('successfulTackles-team-total').textContent = stats.team.successfulTackles;
    document.getElementById('successfulTackles-team-avg').textContent = (stats.team.possessionMatches > 0) ? (stats.team.successfulTackles / stats.team.possessionMatches).toFixed(2) : '-';
    document.getElementById('saves-team-total').textContent = stats.team.save;
    document.getElementById('saves-team-avg').textContent = (stats.team.possessionMatches > 0) ? (stats.team.save / stats.team.possessionMatches).toFixed(2) : '-';
    document.getElementById('saves-team-per').textContent = (stats.opponent.shotsonFrame > 0) ? (stats.team.save*100 / stats.opponent.shotsonFrame).toFixed(2) + '%' : '-';
    document.getElementById('saves2-team-per').textContent = ((stats.opponent.shotsonFrame-stats.opponent.goals)*100 / stats.opponent.shotsonFrame).toFixed(2) + '%';



    // 相手チームの戦績データを表示
    document.getElementById('matches-opp').textContent = stats.opponent.matches;
    document.getElementById('wins-opp-total').textContent = "-";
    document.getElementById('draws-opp-total').textContent = "-";
    document.getElementById('losses-opp-total').textContent = "-";
    document.getElementById('wins-opp-per').textContent = "-";
    document.getElementById('draws-opp-per').textContent = "-";
    document.getElementById('losses-opp-per').textContent = "-";
    
    document.getElementById('goals-opp-total').textContent = stats.opponent.goals;
    document.getElementById('goals-opp-avg').textContent = (stats.opponent.matches > 0) ? (stats.opponent.goals / stats.opponent.matches).toFixed(2) : '-';

    document.getElementById('possession-opp').textContent = (stats.opponent.possessionMatches > 0) ? (stats.opponent.possession / stats.opponent.possessionMatches).toFixed(2) + '%' : '-';

    document.getElementById('shots-opp-total').textContent = stats.opponent.shots;
    document.getElementById('shots-opp-avg').textContent = (stats.opponent.possessionMatches > 0) ? (stats.opponent.shots / stats.opponent.possessionMatches).toFixed(2) : '-';
    document.getElementById('shotsonFrame-opp-total').textContent = stats.opponent.shotsonFrame;
    document.getElementById('shotsonFrame-opp-avg').textContent = (stats.opponent.possessionMatches > 0) ? (stats.opponent.shotsonFrame / stats.opponent.possessionMatches).toFixed(2) : '-';
    document.getElementById('shotsonFrame-opp-per').textContent = (stats.opponent.shots > 0) ? (stats.opponent.shotsonFrame*100 / stats.opponent.shots).toFixed(2) + '%' : '-';
    document.getElementById('goals-opp-per').textContent = (stats.opponent.shots > 0) ? (stats.opponent.goalsWithPossession*100 / stats.opponent.shots).toFixed(2) + '%' : '-';
    
    document.getElementById('fouls-opp-total').textContent = stats.opponent.fouls;
    document.getElementById('fouls-opp-avg').textContent = (stats.opponent.fouls / stats.opponent.matches).toFixed(2);
    document.getElementById('offsides-opp-total').textContent = stats.opponent.offsides;
    document.getElementById('offsides-opp-avg').textContent = (stats.opponent.offsides / stats.opponent.matches).toFixed(2);
    document.getElementById('cornerKicks-opp-total').textContent = stats.opponent.cornerKicks;
    document.getElementById('cornerKicks-opp-avg').textContent = (stats.opponent.cornerKicks / stats.opponent.matches).toFixed(2);
    document.getElementById('freeKicks-opp-total').textContent = stats.opponent.freeKicks;
    document.getElementById('freeKicks-opp-avg').textContent = (stats.opponent.freeKicks / stats.opponent.matches).toFixed(2);
    document.getElementById('passes-opp-total').textContent = stats.opponent.passes;
    document.getElementById('passes-opp-avg').textContent = (stats.opponent.passes / stats.opponent.matches).toFixed(2);
    document.getElementById('successfulPasses-opp-total').textContent = stats.opponent.successfulPasses;
    document.getElementById('successfulPasses-opp-avg').textContent = (stats.opponent.successfulPasses / stats.opponent.matches).toFixed(2);
    document.getElementById('successfulPasses-opp-per').textContent = (stats.opponent.successfulPasses*100 / stats.opponent.passes).toFixed(2) + '%';
    document.getElementById('crosses-opp-total').textContent = stats.opponent.crosses;
    document.getElementById('crosses-opp-avg').textContent = (stats.opponent.crosses / stats.opponent.matches).toFixed(2);
    document.getElementById('PassCuts-opp-total').textContent = stats.opponent.PassCuts;
    document.getElementById('PassCuts-opp-avg').textContent = (stats.opponent.PassCuts / stats.opponent.matches).toFixed(2);
    document.getElementById('successfulTackles-opp-total').textContent = stats.opponent.successfulTackles;
    document.getElementById('successfulTackles-opp-avg').textContent = (stats.opponent.successfulTackles / stats.opponent.matches).toFixed(2);
    document.getElementById('saves-opp-total').textContent = stats.opponent.save;
    document.getElementById('saves-opp-avg').textContent = (stats.opponent.save / stats.opponent.matches).toFixed(2);
    document.getElementById('saves-opp-per').textContent = (stats.opponent.save*100 / stats.team.shotsonFrame).toFixed(2) + '%';
    document.getElementById('saves2-opp-per').textContent = ((stats.team.shotsonFrame-stats.team.goals)*100 / stats.team.shotsonFrame).toFixed(2) + '%';
    

    // 全体スタッツ（TL）の計算
    const overallStats = calculateOverallTeamStats();
    document.getElementById('matches-tl').textContent = overallStats.matches;
    document.getElementById('wins-tl-total').textContent = overallStats.wins;
    document.getElementById('draws-tl-total').textContent = overallStats.draws;
    document.getElementById('losses-tl-total').textContent = overallStats.losses;
    document.getElementById('wins-tl-per').textContent = (overallStats.wins*100 / overallStats.matches).toFixed(2) + '%';
    document.getElementById('draws-tl-per').textContent = (overallStats.draws*100 / overallStats.matches).toFixed(2) + '%';
    document.getElementById('losses-tl-per').textContent = (overallStats.losses*100 / overallStats.matches).toFixed(2) + '%';
    
    document.getElementById('goals-tl-total').textContent = overallStats.goals;
    document.getElementById('goals-tl-avg').textContent = (overallStats.goals / overallStats.matches).toFixed(2);

    document.getElementById('possession-tl').textContent = (overallStats.possessionMatches > 0) ? (overallStats.possession / overallStats.possessionMatches).toFixed(2) + '%' : '-';

    document.getElementById('shots-tl-total').textContent = overallStats.shots;
    document.getElementById('shots-tl-avg').textContent = (overallStats.possessionMatches > 0) ? (overallStats.shots / overallStats.possessionMatches).toFixed(2) : '-';
    document.getElementById('shotsonFrame-tl-total').textContent = overallStats.shotsonFrame;
    document.getElementById('shotsonFrame-tl-avg').textContent = (overallStats.possessionMatches > 0) ? (overallStats.shotsonFrame / overallStats.possessionMatches).toFixed(2) : '-';
    document.getElementById('shotsonFrame-tl-per').textContent = (overallStats.shots > 0) ? (overallStats.shotsonFrame*100 / overallStats.shots).toFixed(2) + '%' : '-';
    document.getElementById('goals-tl-per').textContent = (overallStats.shots > 0) ? (overallStats.goalsWithPossession*100 / overallStats.shots).toFixed(2) + '%' : '-';
    
    document.getElementById('fouls-tl-total').textContent = overallStats.fouls;
    document.getElementById('fouls-tl-avg').textContent = (overallStats.fouls / overallStats.matches).toFixed(2);
    document.getElementById('offsides-tl-total').textContent = overallStats.offsides;
    document.getElementById('offsides-tl-avg').textContent = (overallStats.offsides / overallStats.matches).toFixed(2);
    document.getElementById('cornerKicks-tl-total').textContent = overallStats.cornerKicks;
    document.getElementById('cornerKicks-tl-avg').textContent = (overallStats.cornerKicks / overallStats.matches).toFixed(2);
    document.getElementById('freeKicks-tl-total').textContent = overallStats.freeKicks;
    document.getElementById('freeKicks-tl-avg').textContent = (overallStats.freeKicks / overallStats.matches).toFixed(2);
    document.getElementById('passes-tl-total').textContent = overallStats.passes;
    document.getElementById('passes-tl-avg').textContent = (overallStats.passes / overallStats.matches).toFixed(2);
    document.getElementById('successfulPasses-tl-total').textContent = overallStats.successfulPasses;
    document.getElementById('successfulPasses-tl-avg').textContent = (overallStats.successfulPasses / overallStats.matches).toFixed(2);
    document.getElementById('successfulPasses-tl-per').textContent = (overallStats.successfulPasses*100 / overallStats.passes).toFixed(2) + '%';
    document.getElementById('crosses-tl-total').textContent = overallStats.crosses;
    document.getElementById('crosses-tl-avg').textContent = (overallStats.crosses / overallStats.matches).toFixed(2);
    document.getElementById('PassCuts-tl-total').textContent = overallStats.PassCuts;
    document.getElementById('PassCuts-tl-avg').textContent = (overallStats.PassCuts / overallStats.matches).toFixed(2);
    document.getElementById('successfulTackles-tl-total').textContent = overallStats.successfulTackles;
    document.getElementById('successfulTackles-tl-avg').textContent = (overallStats.successfulTackles / overallStats.matches).toFixed(2);
    document.getElementById('saves-tl-total').textContent = overallStats.save;
    document.getElementById('saves-tl-avg').textContent = (overallStats.save / overallStats.matches).toFixed(2);
    document.getElementById('saves-tl-per').textContent = (overallStats.save*100 / overallStats.shotsonFrame).toFixed(2) + '%';
    document.getElementById('saves2-tl-per').textContent = ((overallStats.shotsonFrame-overallStats.goals)*100 / overallStats.shotsonFrame).toFixed(2) + '%';



    // ゴールとアシストランキングの表示
    displayTeamPlayerRanking('teamGoalPlayersTable', goalPlayers);  // チームゴールランキング
    displayTeamPlayerRanking('teamAssistPlayersTable', assistPlayers);  // チームアシストランキング

    // ゴール・失点グラフの描画
    drawGoalGraph(teamId);

    return stats;
}

// ゴールと失点のグラフを描画する関数
function drawGoalGraph(teamId) {
    let goalTimes = [];
    let concededTimes = [];

    // **すべてのシーズンの試合データを処理**
    // let targetSeasons = Object.keys(matchDataL); // 全シーズンを取得
    let targetSeasons = (displaySeason2 === "all") ? Object.keys(matchDataL) : [displaySeason2];

    targetSeasons.forEach(season => {
        if (!matchDataL[season]) return; // データがないシーズンはスキップ

        for (const matchKey in matchDataL[season]) {
            // `teamsNum` や `currentStandings` をスキップ
            if (matchKey === "teamsNum" || matchKey === "currentStandings" || matchKey === "newDate") continue;

            const match = matchDataL[season][matchKey];

            // `match` が `undefined` の場合はスキップ
            if (!match || !match.home || !match.away) continue;

            const isHome = match.home.teamId === teamId;
            const isAway = match.away.teamId === teamId;

            if (isHome) {
                goalTimes = goalTimes.concat(match.home.times || []);
                concededTimes = concededTimes.concat(match.away.times || []);
            } else if (isAway) {
                goalTimes = goalTimes.concat(match.away.times || []);
                concededTimes = concededTimes.concat(match.home.times || []);
            }
        }
    });

    goalTimes.sort((a, b) => a - b);
    concededTimes.sort((a, b) => a - b);

    createGoalScatterPlot(goalTimes, concededTimes);  // 折れ線グラフの作成（線なし）
    drawStackedGoalGraph(goalTimes, concededTimes, 5);  // 5分刻みの棒グラフ
    drawStackedGoalGraph(goalTimes, concededTimes, 15); // 15分刻みの棒グラフ
}

// 折れ線グラフ（プロットのみ）を作成する関数
function createGoalScatterPlot(goalTimes, concededTimes) {
    const ctx = document.getElementById('goalChart').getContext('2d');
    ctx.canvas.style.backgroundColor = 'white';  // グラフの背景を白に設定

    if (lineChart) {
        lineChart.destroy();
    }

    const goalCounts = {};
    const concededCounts = {};

    goalTimes.forEach(time => {
        goalCounts[time] = (goalCounts[time] || 0) + 1;
    });

    concededTimes.forEach(time => {
        concededCounts[time] = (concededCounts[time] || 0) + 1;
    });

    const maxGoals = Math.max(...Object.values(goalCounts), ...Object.values(concededCounts), 0);
    const yMax = maxGoals + 1;

    lineChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: '得点',
                    data: Object.keys(goalCounts).map(time => ({ x: parseInt(time), y: goalCounts[time] })),
                    backgroundColor: '#32CD32',
                    pointStyle: 'triangle',  // 自チーム得点のマーカー形状
                    pointRadius: 6,
                    showLine: false
                },
                {
                    label: '失点',
                    data: Object.keys(concededCounts).map(time => ({ x: parseInt(time), y: concededCounts[time] })),
                    backgroundColor: '#FF0000',
                    pointStyle: 'rect',  // 失点のマーカー形状
                    pointRadius: 6,
                    showLine: false
                }
            ]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: '得点時間と失点時間のグラフ',
                    color: 'rgb(0, 0, 0)', // タイトル文字色
                    font: { size: 20 }
                },
                legend: {
                    labels: {
                        
                        font: { size: 12 } // 凡例フォントサイズ
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: 90,
                    title: { display: true, text: '時間（分）'

                    },
                    ticks: {  // タイトル文字色
                    },
                    grid: {
                        color: 'lightgray' // 横軸グリッド線の色
                    }

                    
                },
                y: {
                    beginAtZero: true,
                    max: yMax,
                    // title: { display: true, text: 'ゴール数' },
                    ticks: { 
                        stepSize: 1 }
                }
            }
        }
    });
}

// 5分または15分刻みの棒グラフを作成する関数
function drawStackedGoalGraph(goalTimes, concededTimes, interval) {
    const ctxId = interval === 5 ? 'stackedGoalChart5Min' : 'stackedGoalChart15Min';
    const ctx = document.getElementById(ctxId).getContext('2d');
    ctx.canvas.style.backgroundColor = 'white';  // 棒グラフの背景を白に設定

    if (interval === 5 && barChart5Min) {
        barChart5Min.destroy();
    }
    if (interval === 15 && barChart15Min) {
        barChart15Min.destroy();
    }

    const numBuckets = Math.ceil(90 / interval);
    const goalBuckets = Array(numBuckets).fill(0);
    const concededBuckets = Array(numBuckets).fill(0);

    
    goalTimes.forEach(time => {
        const bucketIndex = Math.min(Math.floor(time / interval), numBuckets - 1);
        goalBuckets[bucketIndex]++;
    });

    concededTimes.forEach(time => {
        const bucketIndex = Math.min(Math.floor(time / interval), numBuckets - 1);
        concededBuckets[bucketIndex]++;
    });

    const labels = Array.from({ length: numBuckets }, (_, i) => `${(i + 1) * interval}`);
    // const labels = Array.from({ length: numBuckets }, (_, i) => `~${(i + 1) * interval}分`);

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '得点',
                    data: goalBuckets,
                    backgroundColor: '#32CD32',
                    stack: 'stacked',
                },
                {
                    label: '失点',
                    data: concededBuckets.map(val => -val),
                    backgroundColor: '#FF0000',
                    stack: 'stacked',
                }
            ]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: `${interval}分刻みの得点と失点の分布`,
                    color: 'rgb(0, 0, 0)', // タイトル文字色
                    font: { size: 20 }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: { display: true, text: '時間帯（分）' },
                    ticks: { font: { size: 8 } } // X軸目盛りのフォントサイズ
                },
                y: {
                    beginAtZero: true,
                    stacked: true,
                    // title: { display: true, text: 'ゴール数' },
                    ticks: { stepSize: 1 },
                    // ticks: { font: { size: 10 } } // X軸目盛りのフォントサイズ
                }
            }
        }
    });

    if (interval === 5) {
        barChart5Min = chart;
    } else {
        barChart15Min = chart;
    }
}

