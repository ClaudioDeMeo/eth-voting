'use strict'

var d3 = Plotly.d3;

var model = null;
var candidates = null;
var lists = null;
var numWinnerCandidates = null;
var winnerCandidates = [];
var winnerLists = [];
function layout(title){
  return {
    title: title,
    showlegend: true,
    autosize: true,
    xaxis: {
      title: title.replace(" votes", "")
    },
    yaxis: {
      title: "votes",
      zeroline: false,
      gridwidth: 2,
      autorange: true,
    },
    bargap :0.05
  };
}
function newData(name, color){
  return {
    name: name,
    x: [],
    y: [],
    type: 'bar',
    textposition: 'auto',
    hoverinfo: 'text',
    marker: {
      color: color
    }
  };
}
var candidatesLayout = layout('Candidates votes');
var listsLayout = layout('List votes');
var winnerCandidatesLayout = layout('Winner Candidates votes');
var winnerListsLayout = layout('Winner Lists votes');

var candidatesData = newData("Candidates", 'rgb(31,119,180)');
var listsData = newData("Lists", 'rgb(254,127,14)');
var winnerCandidatesData = newData("Candidates", 'rgb(39,149,39)');
var winnerListsData = newData("Lists", 'rgb(208,34,36)');

var candidatesPlot = d3.select('#candidatesPlot').node();
var listsPlot = d3.select('#listsPlot').node();
var winnerCandidatesPlot = d3.select('#winnerCandidatesPlot').node();
var winnerListsPlot = d3.select('#winnerListsPlot').node();

function getData(){
  $.get('/api', function(data, status){
    if (!model && data.result.model){
      model = data.result.model;
    }
    if (data.result.contractResult){
      candidates = data.result.contractResult.candidates;
      lists = data.result.contractResult.lists;
      winnerCandidates = data.result.contractResult.winnerCandidates.map(function(element){
        return element;
      });
      numWinnerCandidates = winnerCandidates.length;
      winnerLists = data.result.contractResult.winnerLists.map(function(element){
        return {lists: element.lists.map(function(list){
          return list;
        })};
      });
    }
    candidatesData.x = candidates.map(function(candidate){
      return candidate.surname + " " + candidate.name + " (" + candidate.votes + " votes)";
    });
    candidatesData.y = candidates.map(function(candidate){
      return parseInt(candidate.votes);
    });
    candidatesData.text = candidatesData.y;
    winnerCandidatesData.x = winnerCandidates.map(function(element){
      return element.candidate.surname + " " + element.candidate.name + " (" + element.candidate.votes + " votes)";
    });
    winnerCandidatesData.y = winnerCandidates.map(function(element){
      return parseInt(element.candidate.votes);
    });
    winnerCandidatesData.text = winnerCandidatesData.y;
    listsData.x = [];
    listsData.y = [];
    lists.forEach(function(element){
      listsData.x = listsData.x.concat(element.map(function(list){
        return list.name + " (" + list.votes + " votes)";
      }));
      listsData.y = listsData.y.concat(element.map(function(list){
        return parseInt(list.votes);
      }));
      listsData.text = listsData.y;
    });
    winnerListsData.x = [];
    winnerListsData.y = [];
    winnerLists.forEach(function(element){
      winnerListsData.x = winnerListsData.x.concat(element.lists.map(function(e){
        if (e.list){
          return e.list.name + " (" + e.list.votes + " votes)";
        }
      }));
      winnerListsData.y = winnerListsData.y.concat(element.lists.map(function(e){
        if (e.list){
          return parseInt(e.list.votes);
        }
      }));
      winnerListsData.text = winnerListsData.y;
    });
    Plotly.redraw(candidatesPlot);
    Plotly.redraw(listsPlot);
    Plotly.redraw(winnerCandidatesPlot);
    Plotly.redraw(winnerListsPlot);
  })
}

getData();
setInterval(getData, 1000);

var config = {
  displaylogo: false,
  modeBarButtonsToRemove: ['sendDataToCloud']
}

Plotly.newPlot(candidatesPlot, [candidatesData], candidatesLayout, config);
Plotly.newPlot(listsPlot, [listsData], listsLayout, config);
Plotly.newPlot(winnerCandidatesPlot, [winnerCandidatesData], winnerCandidatesLayout, config);
Plotly.newPlot(winnerListsPlot, [winnerListsData], winnerListsLayout, config);

window.onresize = function() {
    Plotly.Plots.resize(candidatesPlot);
    Plotly.Plots.resize(listsPlot);
    Plotly.Plots.resize(winnerCandidatesPlot);
    Plotly.Plots.resize(winnerListsPlot);
};
