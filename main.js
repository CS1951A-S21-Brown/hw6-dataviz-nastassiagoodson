// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = { top: 40, right: 100, bottom: 40, left: 175 };
const filenames = ['../data/football.csv', '../data/football.csv'];

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = MAX_WIDTH / 2 - 10,
    graph_1_height = 250;
let graph_2_width = MAX_WIDTH / 2 - 10,
    graph_2_height = 300;
let graph_3_width = 800,
    graph_3_height = 400;

let graph1 = d3
    .select('#graph1')
    .append('svg')
    .attr('width', graph_1_width)
    .attr('height', graph_1_height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

let countRef = graph1.append('g');

graph1
    .append('text')
    .attr('transform', `translate(${(graph_1_width - margin.left - margin.right) / 2},${graph_1_height - margin.top})`)
    .style('text-anchor', 'middle')
    .text('Year');

graph1
    .append('text')
    .attr('transform', `translate(-70,${(graph_1_height - margin.top - margin.bottom) / 2})`)
    .style('text-anchor', 'middle')
    .text('Games');

graph1
    .append('text')
    .attr('transform', `translate(${(graph_1_width - margin.left - margin.right) / 2},-20)`)
    .style('text-anchor', 'middle')
    .style('font-size', 15)
    .text('Number of Football Games per Year (2010-2015)');

let graph1_y = d3
    .scaleLinear()
    .domain([0, 1200])
    .range([graph_1_height - margin.top - margin.bottom, 0]);

let graph1_x = d3
    .scaleBand()
    .range([0, graph_1_width - margin.left - margin.right])
    .padding(0.4);

graph1
    .append('g')
    .attr('transform', 'translate(0,' + (graph_1_height - margin.top - margin.bottom) + ')')
    .call(d3.axisBottom(graph1_x).tickSize(0).tickPadding(5));
graph1.append('g').call(d3.axisLeft(graph1_y).tickPadding(10));

let graph2 = d3
    .select('#graph2')
    .append('svg')
    .attr('width', graph_2_width)
    .attr('height', graph_2_height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

let countRef2 = graph2.append('g');

let graph2_x = d3.scaleLinear().range([0, graph_2_width - margin.left - margin.right]);

let x_axis_label = graph2.append('g');

let graph2_y = d3
    .scaleBand()
    .range([0, graph_2_height - margin.top - margin.bottom])
    .padding(0.1);

let y_axis_label = graph2.append('g');

graph2
    .append('text')
    .attr('transform', `translate(-100,${(graph_2_height - margin.top - margin.bottom) / 2})`)
    .style('text-anchor', 'middle')
    .text('Country');

graph2
    .append('text')
    .attr('transform', `translate(${(graph_2_width - margin.left - margin.right) / 2},-20)`)
    .style('text-anchor', 'middle')
    .style('font-size', 15)
    .text('Top Performing Countries from the Last Two World Cups*');

let x_axis_text = graph2
    .append('text')
    .attr('transform', `translate(${(graph_2_width - margin.left - margin.right) / 2},${graph_2_height - margin.top})`)
    .style('text-anchor', 'middle');

let map = d3
    .select('#graph3')
    .append('svg')
    .attr('align', 'center')
    .attr('width', graph_3_width)
    .attr('height', graph_3_height)
    .append('g');

let mapTooltip = d3.select('#graph3').append('div').attr('class', 'tooltip').style('opacity', 0);

let projection = d3
    .geoMercator()
    .scale(120)
    .center([0, 15])
    .translate([graph_3_width / 2, graph_3_height / 2]);

let path = d3.geoPath().projection(projection);

function setData(index, attr) {
    'use strict';
    Promise.all([
        d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'),
        d3.csv(filenames[index]),
    ]).then(function (data) {
        graph2.selectAll('line').remove();
        graph2.selectAll('circle').remove();
        map.selectAll('path').remove();

        let world = data[0];
        let football = data[1];

        let years = ['2010', '2011', '2012', '2013', '2014', '2015'];

        let res = cleanData(football, years, index);
        let teamData = res[1];
        let obj = res[0];
        let yearData = res[2];
        let worldCupData = res[3];

        let colorMap = d3
            .scaleOrdinal()
            .domain(
                teamData.map(function (d) {
                    return d[1][attr];
                })
            )
            .range(d3.quantize(d3.interpolateHcl('#66a0e2', '#81c2c3'), 10));

        let mouseoverMap = function (d) {
            d3.select(this).transition().duration(200).style('opacity', 0.8);

            if (obj.hasOwnProperty(d['properties']['name'])) {
                let html = `
            <span>${d['properties']['name']}</span><br/>
            Total Games Won: ${obj[d['properties']['name']]['games_won']}<br/>
            Total Games Played: ${obj[d['properties']['name']]['games_played']}<br/>
            Winning Percentage: ${(obj[d['properties']['name']]['percent_wins'] * 100).toFixed(2)}%
            `;

                let xposition = d3.event.pageX - 300 < 0 ? d3.event.pageX : d3.event.pageX - 300;

                let yposition = d3.event.pageY - 500;

                mapTooltip
                    .html(html)
                    .style('left', `${xposition}px`)
                    .style('top', `${yposition}px`)
                    .style('background-color', 'white')
                    .style('border-radius', '10px')
                    .style('padding', '10px')
                    .style('width', '250px')
                    .style('border', `5px solid ${colorMap(obj[d['properties']['name']][attr])}`)
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
            }
        };

        let mouseoutMap = function (d) {
            mapTooltip.transition().duration(200).style('opacity', 0);
            d3.select(this).transition().duration(200).style('opacity', 1).style('stroke', 'black');
        };

        map.selectAll('path')
            .data(world.features)
            .enter()
            .append('path')
            .attr('fill', function (d) {
                if (obj.hasOwnProperty(d['properties']['name'])) {
                    return colorMap(obj[d['properties']['name']][attr]);
                } else {
                    return '#808080';
                }
            })
            .attr('stroke', '#000')
            .attr('d', path)
            .on('mouseover', mouseoverMap)
            .on('mouseout', mouseoutMap);

        let color = d3
            .scaleOrdinal()
            .domain(
                yearData.map(function (d) {
                    return d[0];
                })
            )
            .range(d3.quantize(d3.interpolateHcl('#66a0e2', '#81c2c3'), years.length));

        graph1_x.domain(
            yearData.map(function (d) {
                return d[0];
            })
        );

        let bars = graph1.selectAll('rect').data(yearData);

        bars.enter()
            .append('rect')
            .merge(bars)
            .attr('fill', function (d) {
                return color(d[0]);
            })
            .attr('x', function (d) {
                return graph1_x(d[0]);
            })
            .attr('y', function (d) {
                return graph1_y(d[1]);
            })
            .attr('width', graph1_x.bandwidth())
            .attr('height', function (d) {
                return graph_1_height - margin.top - margin.bottom - graph1_y(d[1]);
            });

        let counts = countRef.selectAll('text').data(yearData);

        counts
            .enter()
            .append('text')
            .merge(counts)

            .style('text-anchor', 'middle')
            .attr('x', function (d) {
                return graph1_x(d[0]) + graph1_x.bandwidth() / 2;
            })

            .attr('y', function (d) {
                return graph1_y(d[1]) - 3;
            })
            .text(function (d) {
                return d[1];
            });

        graph2_x.domain([0, index === 1 ? 1 : 30]);

        graph2_y.domain(
            worldCupData.map(function (d) {
                return d[0];
            })
        );

        x_axis_label
            .attr('transform', 'translate(0,' + (graph_2_height - margin.top - margin.bottom) + ')')
            .call(d3.axisBottom(graph2_x).tickSize(0).tickPadding(10));

        y_axis_label.call(d3.axisLeft(graph2_y).tickSize(0).tickPadding(10));

        let lines = graph2.selectAll('myline').data(worldCupData);

        lines
            .enter()
            .append('line')
            .merge(lines)
            .attr('x1', function (d) {
                return graph2_x(d[1][attr]);
            })
            .attr('x2', graph2_x(0))
            .attr('y1', function (d) {
                return graph2_y(d[0]) + 7;
            })
            .attr('y2', function (d) {
                return graph2_y(d[0]) + 7;
            })
            .attr('stroke', 'black');

        let circles = graph2.selectAll('mycircle').data(worldCupData);

        circles
            .enter()
            .append('circle')
            .attr('cx', function (d) {
                return graph2_x(d[1][attr]);
            })
            .attr('cy', function (d) {
                return graph2_y(d[0]) + 7;
            })
            .attr('r', 4)
            .style('fill', function (d) {
                return color(d[0]);
            })
            .attr('stroke', 'black');

        let counts2 = countRef2.selectAll('text').data(worldCupData);

        counts2
            .enter()
            .append('text')
            .merge(counts2)
            .transition()
            .duration(1000)
            .style('text-anchor', 'middle')
            .attr('y', function (d) {
                return graph2_y(d[0]) + 12;
            })
            .attr('x', function (d) {
                return graph2_x(d[1][attr]) + 20;
            })
            .text(function (d) {
                if (index === 1) {
                    return d[1].percent_wins.toFixed(2);
                } else {
                    return d[1].games_won;
                }
            });

        x_axis_text.text(index === 1 ? 'Percent Wins' : 'Number of Wins');

        counts2.exit().remove();
        lines.exit().remove();
        circles.exit().remove();
    });
}

/**
 * Cleans the provided data using the given comparator then strips to first numExamples
 * instances
 */
function cleanData(football, years, index) {
    let yearData = {};
    let teamData = {};
    let worldCupData = {};
    years.forEach(function (d) {
        yearData[d] = 0;
    });

    football.forEach(function (d) {
        year = d['date'].substr(0, 4);
        if (yearData.hasOwnProperty(year)) {
            yearData[year] += 1;
        }
        const isFIFA = parseInt(year) <= 2018 && parseInt(year) >= 2011 && d['tournament'].substr(0, 4) === 'FIFA';
        if (d['home_team'] === 'United States') {
            d['home_team'] = 'USA';
        }
        if (d['away_team'] === 'United States') {
            d['away_team'] = 'USA';
        }

        if (d['home_score'] > d['away_score']) {
            if (teamData.hasOwnProperty(d['home_team'])) {
                teamData[d['home_team']]['games_won'] += 1;
                teamData[d['home_team']]['games_played'] += 1;
            } else {
                teamData[d['home_team']] = { games_won: 1, games_played: 1 };
            }

            if (isFIFA && worldCupData.hasOwnProperty(d['home_team'])) {
                worldCupData[d['home_team']]['games_won'] += 1;
                worldCupData[d['home_team']]['games_played'] += 1;
            } else if (isFIFA) {
                worldCupData[d['home_team']] = { games_won: 1, games_played: 1 };
            }

            if (teamData.hasOwnProperty(d['away_team'])) {
                teamData[d['away_team']]['games_played'] += 1;
            } else {
                teamData[d['away_team']] = { games_won: 0, games_played: 1 };
            }

            if (isFIFA && worldCupData.hasOwnProperty(d['away_team'])) {
                worldCupData[d['away_team']]['games_played'] += 1;
            } else if (isFIFA) {
                worldCupData[d['away_team']] = { games_won: 0, games_played: 1 };
            }
        } else if (d['away_score'] > d['home_score']) {
            if (teamData.hasOwnProperty(d['home_team'])) {
                teamData[d['home_team']]['games_played'] += 1;
            } else {
                teamData[d['home_team']] = { games_won: 0, games_played: 1 };
            }

            if (isFIFA && worldCupData.hasOwnProperty(d['home_team'])) {
                worldCupData[d['home_team']]['games_played'] += 1;
            } else if (isFIFA) {
                worldCupData[d['home_team']] = { games_won: 0, games_played: 1 };
            }

            if (teamData.hasOwnProperty(d['away_team'])) {
                teamData[d['away_team']]['games_won'] += 1;
                teamData[d['away_team']]['games_played'] += 1;
            } else {
                teamData[d['away_team']] = { games_won: 1, games_played: 1 };
            }

            if (isFIFA && worldCupData.hasOwnProperty(d['away_team'])) {
                worldCupData[d['away_team']]['games_won'] += 1;
                worldCupData[d['away_team']]['games_played'] += 1;
            } else if (isFIFA) {
                worldCupData[d['away_team']] = { games_won: 1, games_played: 1 };
            }
        } else {
            if (teamData.hasOwnProperty(d['home_team'])) {
                teamData[d['home_team']]['games_played'] += 1;
            } else {
                teamData[d['home_team']] = { games_won: 0, games_played: 1 };
            }
            if (teamData.hasOwnProperty(d['away_team'])) {
                teamData[d['away_team']]['games_played'] += 1;
            } else {
                teamData[d['away_team']] = { games_won: 0, games_played: 1 };
            }
        }
    });

    yearData = Object.entries(yearData);

    teamData = Object.entries(teamData);

    teamData.map((el) => {
        return (el[1]['percent_wins'] = el[1].games_won / el[1].games_played);
    });

    teamData =
        index === 1
            ? teamData
                  .filter(function (d) {
                      return d[1].games_played >= 250;
                  })
                  .sort(function (a, b) {
                      let a_percent = a[1].percent_wins;
                      let b_percent = b[1].percent_wins;

                      return b_percent - a_percent;
                  })
                  .slice(0, 10)
            : teamData
                  .sort(function (a, b) {
                      let a_percent = a[1].games_won;
                      let b_percent = b[1].games_won;

                      return b_percent - a_percent;
                  })
                  .slice(0, 10);

    worldCupData = Object.entries(worldCupData);

    worldCupData.map((el) => {
        return (el[1]['percent_wins'] = el[1].games_won / el[1].games_played);
    });

    worldCupData =
        index === 1
            ? worldCupData
                  .sort(function (a, b) {
                      let a_percent = a[1].percent_wins;
                      let b_percent = b[1].percent_wins;

                      return b_percent - a_percent;
                  })
                  .slice(0, 15)
            : worldCupData
                  .sort(function (a, b) {
                      let a_percent = a[1].games_won;
                      let b_percent = b[1].games_won;

                      return b_percent - a_percent;
                  })
                  .slice(0, 15);

    worldCupData = worldCupData.sort(function (a, b) {
        return a[0].localeCompare(b[0]);
    });

    let obj = {};
    teamData.forEach(function (element) {
        obj[element[0]] = element[1];
    });

    let worldCupObj = {};

    worldCupData.forEach(function (element) {
        worldCupObj[element[0]] = element[1];
    });

    return [obj, teamData, yearData, worldCupData, worldCupObj];
}

setData(1, 'percent_wins');
