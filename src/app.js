async function fetchMatches() {
  const URL =
    'https://web.scraper.workers.dev/?url=https%3A%2F%2Fwww.hltv.org%2Fmatches&selector=div.upcomingMatchesSection+div&scrape=attr&attr=&pretty=true';
  const response = await fetch(URL);
  const data = await response.json();
  return data.result['div.upcomingMatchesSection div'];
}
async function fetchDays() {
  const URL =
    'https://web.scraper.workers.dev/?url=https%3A%2F%2Fwww.hltv.org%2Fmatches&selector=.matchDayHeadline&scrape=text&pretty=true';
  const response = await fetch(URL);
  const data = await response.json();
  return data.result['.matchDayHeadline'];
}

function separateMatches(fetchedData) {
  let matchesArray = [];
  let matchArray = [];
  let separatorTrigger = false;
  for (let i = 0; i < fetchedData.length; i++) {
    //if an hour is found, check if it is for the current match or the next one
    if (/\d\d:\d\d/.test(fetchedData[i])) {
      //if there is already an hour in the match array, add the match and empty the array to create another
      if (separatorTrigger === true) {
        matchesArray.push(matchArray);
        matchArray = [];
        matchArray.push(fetchedData[i]);
      }

      //else, update the separator flag and just push the hour
      else {
        separatorTrigger = true;
        matchArray.push(fetchedData[i]);
      }
    } //if the last added item is the last one, also push the match into the matches array
    else if (i + 1 === fetchedData.length) {
      matchArray.push(fetchedData[i]);
      matchesArray.push(matchArray);
    }
    // for other data, just push it into the match array
    else {
      matchArray.push(fetchedData[i]);
    }
  }
  return matchesArray;
}

class Match {
  constructor(hour, type, teams, tournament) {
    this.hour = hour;
    this.type = type;
    this.teams = teams;
    this.tournament = tournament;
  }
}

function organizeDays(organizedMatches, fetchedDays) {
  let lastHour = '';
  let counter = 0;
  let organizedDays = [];
  let matchesArray = [];

  for (let i in organizedMatches) {
    //if this is the first hour checked for:
    if (lastHour === '') {
      organizedDays.push(fetchedDays[counter]);
      matchesArray.push(organizedMatches[i]);

      lastHour = parseInt(
        organizedMatches[i][0][0] + organizedMatches[i][0][1]
      );
      organizedDays.push(matchesArray);

      // console.log('counter: ', counter);
    }
    //if there are past hours:
    else {
      let newLastHour = parseInt(
        organizedMatches[i][0][0] + organizedMatches[i][0][1]
      );

      if (newLastHour < lastHour) {
        // console.log(newLastHour, lastHour);
        // console.log('new day');
        counter = counter + 1;
        // console.log('counter: ', counter);

        lastHour = newLastHour;
        organizedDays.push(fetchedDays[counter]);
        matchesArray.push(organizedMatches[i]);
        organizedDays.push(matchesArray);
        matchesArray = [];
      } else {
        matchesArray.push(organizedMatches[i]);

        lastHour = parseInt(
          organizedMatches[i][0][0] + organizedMatches[i][0][1]
        );
        //console.log('same day');
      }
    }
  }
  return organizedDays;
}

const cookData = async () => {
  let fetchedData = await fetchMatches();
  const organizedMatches = separateMatches(fetchedData);
  let fetchedDays = await fetchDays();

  const organizedDays = organizeDays(organizedMatches, fetchedDays);
  return organizedDays;
};

function drawData(cookedData) {}

window.onload = async () => {
  const cookedData = await cookData();
  drawData(cookedData);
  console.log(cookedData);
};
