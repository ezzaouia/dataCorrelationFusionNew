'use strict';

var directives = angular.module('directives.client', []);

directives.directive('moodMapChart', function () {
    return {
        restricted: 'E',
        scope: {
            mood: '=data',
            changeHandler: '=',
            moodPoints: '=',
            checkPoint: '='
        },
        controller: function ($scope, $element, $attrs, $log, $mdDialog, d3, absFilter, roundFilter) {

            $scope.$watch('moodPoints + checkPoint', function (/*newVal*/) {
                //console.log('$scope.moodPoints ======', $scope.moodPoints);
                if ($scope.moodPoints) {
                    _plotMoodsPoints($scope.moodPoints);
                }
            }, true);

            var moodMapLabels = {
                y_top: 'intensity.positive',
                y_bottom: 'intensity.negative',
                x_right: 'feeling.positive',
                x_left: 'feeling.negative'
            };

            var circle = null;

            // Start SVG
            // -------------------------------------------------
            var svg = d3.select($element[0])
                .append('svg')
                .attr('class', 'svg-mood-map-chart');

            svg.append('image')
                .attr('xlink:href', 'http://img15.hostingpics.net/pics/43163359bg.png')
                .attr('class', 'svg-mood-map-chart')
                .attr('height', '100%')
                .attr('width', '100%')
                .attr('x', '0')
                .attr('y', '0');

            var margin = {
                top: 15,
                right: 15,
                bottom: 15,
                left: 15
            };

            var percent = d3.format('%');

            var width = 300;
            var height = 300;

            svg.attr({
                width: width,
                height: height
            });

            //noinspection JSUnresolvedFunction
            var xScale = d3.scale.linear()
                .domain([-1, 1])
                .range([margin.left, width - margin.right])
                .nice();

            //noinspection JSUnresolvedFunction
            var yScale = d3.scale.linear()
                .domain([-1, 1])
                .nice()
                .range([height - margin.top, margin.bottom])
                .nice();

            //noinspection JSUnresolvedFunction
            var xAxis = d3.svg.axis()
                .scale(xScale)
                .tickFormat(percent);

            //noinspection JSUnresolvedFunction
            var yAxis = d3.svg.axis()
                .orient('left')
                .scale(yScale)
                .tickFormat(percent);

            var y_axis_g = svg.append('g')
                .attr('class', 'axis')
                .attr('transform', 'translate(' + width / 2 + ',0)');

            y_axis_g.call(yAxis);

            svg.append('g')
                .attr('class', 'axis')
                .attr('transform', 'translate(0,' + height / 2 + ')')
                .call(xAxis);

            // ---------------------------------------------
            // Add labels to our moodmap svg
            // ---------------------------------------------
            svg.append('text')
                .attr('class', 'x_right_label')
                .attr('text-anchor', 'end')
                .attr('x', width - margin.right)
                .attr('y', height / 2 - 5)
                .text(moodMapLabels.x_right);

            svg.append('text')
                .attr('class', 'x_left_label')
                .attr('text-anchor', 'start')
                .attr('x', margin.left)
                .attr('y', height / 2 - 5)
                .text(moodMapLabels.x_left);

            svg.append('text')
                .attr('class', 'y_top_label')
                .attr('text-anchor', 'end')
                .attr('x', -margin.top)
                .attr('y', width / 2 + 5)
                .attr('dy', '.75em')
                .attr('transform', 'rotate(-90)')
                .text(moodMapLabels.y_top);

            svg.append('text')
                .attr('class', 'y_bottom_label')
                .attr('text-anchor', 'end')
                .attr('x', -height + 95)
                .attr('y', height / 2 + 5)
                .attr('dy', '.75em')
                .attr('transform', 'rotate(-90)')
                .text(moodMapLabels.y_bottom);

            // ---------------------------------------------
            // End adding labels to our moodmap svg
            // ---------------------------------------------


            // -------------------------------------------------
            // Add focuse to the svg element
            // -------------------------------------------------
            $scope.mood.bMoodMapClicked = false;

            var div = d3.select($element[0])
                .append('div')
                .attr('class', 'mood-map-chart-tooltip')
                .style('display', 'none');

            function mousemove() {
                if ($scope.mood.bMoodMapClicked) {
                    return;
                }

                // removing circle if exist
                if (circle) {
                    circle.transition()
                        .attr('r', 15)
                        .style('fill', '#FF9800')
                        .duration(500)
                        .each('end', function () {
                            d3.select(this).remove();
                        });
                }

                /* jshint -W040 */
                var pos = d3.mouse(this);
                $scope.mood.xValue = absFilter(xScale.invert(pos[0])) > 1 ? Math.sign(xScale.invert(pos[0])) * 1 : xScale.invert(pos[0]);
                $scope.mood.yValue = absFilter(yScale.invert(pos[1])) > 1 ? Math.sign(yScale.invert(pos[1])) * 1 : yScale.invert(pos[1]);

                console.log($scope.mood.xValue);
                console.log($scope.mood.yValue);
                // add x, y position to the div
                div.text(roundFilter($scope.mood.xValue * 100) + ', ' + roundFilter($scope.mood.yValue * 100))
                    .style('left', (d3.event.pageX - 28) + 'px')
                    .style('top', (d3.event.pageY - 17) + 'px');

                if ($scope.changeHandler) {
                    $scope.changeHandler($scope.mood);
                }
            }

            function mouseover() {
                div.style('display', 'inline');
            }

            function mouseout() {
                div.style('display', 'none');
            }

            svg.append('rect')
                .attr('class', 'overlay')
                //.attr('fill', 'url(#bg)')
                // .classed('filled', true)
                .attr('width', width)
                .attr('height', height);
            //.on('mouseover', mouseover)
            //.on('mousemove', mousemove)
            //.on('mouseout', mouseout);
            //----------------------------------------------------
            // End adding focus
            //----------------------------------------------------


            // ------------------------------------
            // OnClick event on the moodMap
            // ------------------------------------
            // svg.on('click', function() {
            //   if ($scope.mood.bMoodMapClicked) {
            //     return;
            //   }

            //   var e = d3.event;
            //   // Get relative cursor position
            //   var xpos = (e.offsetX === undefined) ? e.layerX : e.offsetX;
            //   var ypos = (e.offsetY === undefined) ? e.layerY : e.offsetY;


            //   console.log('==== click', e.offsetX, e.layerX);
            //   console.log('==== click', e.offsetY, e.layerY);

            //   circle = svg.append('circle')
            //     .attr('cx', xpos)
            //     .attr('cy', ypos)
            //     .style('fill', '#26a9df')
            //     .attr('r', 5);

            //   var pos = d3.mouse(this);
            //   $scope.mood.xValue = absFilter(xScale.invert(pos[0])) > 1 ? Math.sign(xScale.invert(pos[0])) * 1 :
            // xScale.invert(pos[0]); $scope.mood.yValue = absFilter(yScale.invert(pos[1])) > 1 ?
            // Math.sign(yScale.invert(pos[1])) * 1 : yScale.invert(pos[1]);

            //   $scope.mood.bMoodMapClicked = true;
            // });

            function pointPosition(array) {
                if (array[0] >= 0 && array[1] >= 0) {
                    return '#1B5E20';
                }
                if (array[0] >= 0 && array[1] < 0) {
                    return '#AA00FF';
                }
                if (array[0] < 0 && array[1] >= 0) {
                    return '#607D8B';
                }
                if (array[0] < 0 && array[1] < 0) {
                    return '#795548';
                }
            }

            var div = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);

            // plot points on the moodMap
            function _plotMoodsPoints(arrayMoods) {

                svg
                    .selectAll('circle')
                    //.exit()
                    .transition()
                    .duration(100)
                    .delay(100)
                    .style('fill', 'red')
                    .transition()
                    .duration(100)
                    .delay(500)
                    .attr('r', 0)
                    .transition()
                    .each('end', function () {
                        d3.select(this).remove();
                    });

                svg
                    .selectAll('circles')
                    .data(arrayMoods)
                    .enter()
                    .append('circle')
                    .attr('cx', function (d) { return xScale(d[0]); })
                    .style('fill', function (d) { return pointPosition(d); })
                    .attr('fill-opacity', 0.5)
                    .attr('cy', function (d) { return yScale(d[1]); })
                    .attr('r', 5)
                    .on('mouseover', function (d) {
                        div.transition()
                            .duration(200)
                            .style('opacity', .9);

                        var emotionName = d[2] ? '<br/>' + d[2].toString() : '';
                        emotionName += d[3] ? '<br/>' + d[3] : '';
                        emotionName += d[4] ? ' - ' + d[4] : '';

                        div.html(roundFilter(d[0] * 100) + ', ' + roundFilter(d[1] * 100) + '' + emotionName)
                            .style('left', (d3.event.pageX) + 'px')
                            .style('top', (d3.event.pageY - 30) + 'px');

                        d3.select(this)
                            .style('fill', function (d) { return 'teal' }).transition()
                            .duration(100).attr("r", function (d) { return Math.floor(10) });
                    })
                    .on('mouseout', function (d) {
                        div.transition()
                            .duration(500)
                            .style('opacity', 0);
                        d3.select(this)
                            .style('fill', function (d) { return pointPosition(d); }).transition()
                            .duration(100).attr('r', function (d) { return 5 });
                    });
            }


        }

    };
});

directives.directive('discreteEmotions', function () {
    // controller
    return {
        restricted: 'E',
        templateUrl: 'emoviz-discrete-emotions.client.view.html',
        scope: {
            discrete_emotions: '=data',
            ngDisabled: '='
        },
        controller: function ($scope) {

            // Discrete Emotions
            // 'ANGER', 'CONTEMPT', 'DISGUST', 'FEAR', 'HAPPINESS', 'NEUTRAL', 'SADNESS', 'SURPRISE'
            // ----------------------------
            $scope.discrete_emotions = $scope.discrete_emotions || [];
        }
    };
});

directives.directive('discreteEmotionsTl', function () {
    return {
        restricted: 'E',
        scope: {
            emotionLevelValues: '=',
            options: '=',
            checkPoint: '='
        },
        controller: function ($scope, $element, $attrs, $log, d3, absFilter, roundFilter) {

            $scope.$watch('emotionLevelValues + checkPoint', function () {
                if ($scope.emotionLevelValues) {
                    _plotDiscreteEmotionsPoints($scope.emotionLevelValues);
                }
            }, true);

            // Start SVG
            // -------------------------------------------------
            var svg = d3.select($element[0])
                .append('svg')
                .attr('class', 'discrete-emotions-tl');

            var margin = {
                top: 15,
                right: 15,
                bottom: 15,
                left: 15
            };

            var percent = d3.format('%');

            var width = 300;
            var height = 50;

            svg.attr({
                width: width,
                height: height
            });

            //noinspection JSUnresolvedFunction
            var xScale = d3.scale.linear()
                .domain([0, 100])
                .range([margin.left, width - margin.right])
                .nice();

            //noinspection JSUnresolvedFunction
            var xAxis = d3.svg.axis()
                .scale(xScale);
            //.tickFormat(percent);

            svg.append('g')
                .attr('class', 'axis')
                .attr('transform', 'translate(0,' + height / 2 + ')')
                .call(xAxis);

            var div = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);

            function _plotDiscreteEmotionsPoints(discreteEmotions) {
                svg
                    .selectAll('circle')
                    //.exit()
                    .transition()
                    .duration(100)
                    .delay(100)
                    .style('fill', 'red')
                    .transition()
                    .duration(100)
                    .delay(500)
                    .attr('r', 0)
                    .transition()
                    .remove();

                svg
                    .selectAll('circle')
                    .data(discreteEmotions)
                    .enter()
                    .append('circle')
                    .attr('cx', function (d) { return xScale(d); })
                    .style('fill', 'black')
                    .attr('fill-opacity', 0.5)
                    .attr('cy', function (d) { return (height / 2); })
                    .attr('r', 5)
                    .on('mouseover', function (d) {
                        div.transition()
                            .duration(200)
                            .style('opacity', .9);
                        div.html(d + ' %')
                            .style('left', (d3.event.pageX) + 'px')
                            .style('top', (d3.event.pageY - 30) + 'px');

                        d3.select(this)
                            .style('fill', function (d) { return 'teal' }).transition()
                            .duration(100).attr("r", function (d) { return Math.floor(10) });
                    })
                    .on('mouseout', function (d) {
                        div.transition()
                            .duration(500)
                            .style('opacity', 0);
                        d3.select(this)
                            .style('fill', function (d) { return 'black' }).transition()
                            .duration(100).attr('r', function (d) { return 5 });
                    });
            }

        }
    }
});

directives.directive('discreteEmotionsScatterChart', function () {
    return {
        restricted: 'E',
        scope: {
            mood: '=data',
            changeHandler: '=',
            moodPoints: '=',
            checkPoint: '='
        },
        controller: function ($scope, $element, $attrs, $log, $mdDialog, d3, absFilter, roundFilter) {

            $scope.$watch('moodPoints + checkPoint', function (/*newVal*/) {
                //console.log('$scope.moodPoints ======', $scope.moodPoints);
                if ($scope.moodPoints) {
                    _plotMoodsPoints($scope.moodPoints);
                }
            }, true);

            var moodMapLabels = {
                y_top: 'intensity.positive',
                y_bottom: 'intensity.negative',
                x_right: 'feeling.positive',
                x_left: 'feeling.negative'
            };

            // Start SVG
            // -------------------------------------------------
            var svg = d3.select($element[0])
                .append('svg')
            //.attr('class', 'svg-mood-map-chart');


            var margin = {
                top: 30,
                right: 30,
                bottom: 30,
                left: 45
            };

            var percent = d3.format('%');

            var width = 350;
            var height = 350;

            svg.attr({
                width: width,
                height: height
            });

            //noinspection JSUnresolvedFunction
            var xScale = d3.scale.linear()
                .domain([0, 700])
                .range([margin.left, width - margin.right])
                .nice();

            //noinspection JSUnresolvedFunction
            var yScale = d3.scale.linear()
                .domain([0, 1])
                .range([height - margin.top, margin.bottom])
                .nice();

            //noinspection JSUnresolvedFunction
            var xAxis = d3.svg.axis()
                .orient('bottom')
                .scale(xScale);

            //noinspection JSUnresolvedFunction
            var yAxis = d3.svg.axis()
                .orient('left')
                .scale(yScale)
                .tickFormat(percent);

            var y_axis_g = svg.append('g')
                .attr('class', 'axis')
                .attr('transform', 'translate(' + (margin.left) + ',0)');

            y_axis_g.call(yAxis);

            svg.append('g')
                .attr('class', 'axis')
                .attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
                .call(xAxis);

            // ---------------------------------------------
            // Add labels to our moodmap svg
            // ---------------------------------------------
            svg.append('text')
                .attr('class', 'x_right_label')
                .attr('text-anchor', 'end')
                .attr('x', width - margin.right)
                .attr('y', height - 5)
                .text(moodMapLabels.x_right);

            svg.append('text')
                .attr('class', 'y_top_label')
                .attr('text-anchor', 'end')
                .attr('x', -margin.top)
                .attr('y', 10)
                .attr('transform', 'rotate(-90)')
                .text(moodMapLabels.y_top);

            $scope.mood.bMoodMapClicked = false;

            var div = d3.select($element[0])
                .append('div')
                .attr('class', 'mood-map-chart-tooltip')
                .style('display', 'none');


            svg.append('rect')
                .attr('class', 'overlay')
                //.attr('fill', 'url(#bg)')
                // .classed('filled', true)
                .attr('width', width)
                .attr('height', height);

            function pointPosition(array) {
                if (array[0] >= 0 && array[1] >= 0) {
                    return '#1B5E20';
                }
                if (array[0] >= 0 && array[1] < 0) {
                    return '#AA00FF';
                }
                if (array[0] < 0 && array[1] >= 0) {
                    return '#607D8B';
                }
                if (array[0] < 0 && array[1] < 0) {
                    return '#795548';
                }
            }

            var div = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);

            var color = d3.scale.category10()

            // plot points on the moodMap
            function _plotMoodsPoints(arrayMoods) {

                svg
                    .selectAll('circle')
                    //.exit()
                    .transition()
                    .duration(100)
                    .delay(100)
                    .style('fill', 'red')
                    .transition()
                    .duration(100)
                    .delay(500)
                    .attr('r', 0)
                    .transition()
                    .each('end', function () {
                        d3.select(this).remove();
                    });

                svg
                    .selectAll('circles')
                    .data(arrayMoods)
                    .enter()
                    .append('circle')
                    .attr('cx', function (d) { return xScale(d.x); })
                    .style('fill', function (d, i) { return color(i); })
                    .attr('fill-opacity', 0.5)
                    .attr('cy', function (d) { return yScale(d.surprise); })
                    .attr('r', 3)
                    .on('mouseover', function (d) {
                        div.transition()
                            .duration(200)
                            .style('opacity', .9);


                        div.html(d.x + ', ' + roundFilter(d.surprise * 100))
                            .style('left', (d3.event.pageX) + 'px')
                            .style('top', (d3.event.pageY + 80) + 'px');

                        d3.select(this)
                            .style('fill', function (d) { return 'teal' }).transition()
                            .duration(100).attr("r", function (d) { return Math.floor(10) });
                    })
                    .on('mouseout', function (d) {
                        div.transition()
                            .duration(500)
                            .style('opacity', 0);
                        d3.select(this)
                            .style('fill', function (d, i) { return color(i); }).transition()
                            .duration(100).attr('r', function (d) { return 3 });
                    });

                svg
                    .selectAll('circles')
                    .data(arrayMoods)
                    .enter()
                    .append('circle')
                    .attr('cx', function (d) { return xScale(d.x); })
                    .style('fill', function (d, i) { return color(i); })
                    .attr('fill-opacity', 0.5)
                    .attr('cy', function (d) { return yScale(d.happiness); })
                    .attr('r', 3)
                    .on('mouseover', function (d) {
                        div.transition()
                            .duration(200)
                            .style('opacity', .9);


                        div.html(d.x + ', ' + roundFilter(d.happiness * 100))
                            .style('left', (d3.event.pageX) + 'px')
                            .style('top', (d3.event.pageY - 30) + 'px');

                        d3.select(this)
                            .style('fill', function (d) { return 'teal' }).transition()
                            .duration(100).attr("r", function (d) { return Math.floor(10) });
                    })
                    .on('mouseout', function (d) {
                        div.transition()
                            .duration(500)
                            .style('opacity', 0);
                        d3.select(this)
                            .style('fill', function (d, i) { return color(i); }).transition()
                            .duration(100).attr('r', function (d) { return 3 });
                    });

                svg
                    .selectAll('circles')
                    .data(arrayMoods)
                    .enter()
                    .append('circle')
                    .attr('cx', function (d) { return xScale(d.x); })
                    .style('fill', function (d, i) { return color(i); })
                    .attr('fill-opacity', 0.5)
                    .attr('cy', function (d) { return yScale(d.sadness); })
                    .attr('r', 3)
                    .on('mouseover', function (d) {
                        div.transition()
                            .duration(200)
                            .style('opacity', .9);


                        div.html(d.x + ', ' + roundFilter(d.sadness * 100))
                            .style('left', (d3.event.pageX) + 'px')
                            .style('top', (d3.event.pageY - 30) + 'px');

                        d3.select(this)
                            .style('fill', function (d) { return 'teal' }).transition()
                            .duration(100).attr("r", function (d) { return Math.floor(10) });
                    })
                    .on('mouseout', function (d) {
                        div.transition()
                            .duration(500)
                            .style('opacity', 0);
                        d3.select(this)
                            .style('fill', function (d, i) { return color(i); }).transition()
                            .duration(100).attr('r', function (d) { return 3 });
                    });

                svg
                    .selectAll('circles')
                    .data(arrayMoods)
                    .enter()
                    .append('circle')
                    .attr('cx', function (d) { return xScale(d.x); })
                    .style('fill', function (d, i) { return color(i); })
                    .attr('fill-opacity', 0.5)
                    .attr('cy', function (d) { return yScale(d.neutral); })
                    .attr('r', 3)
                    .on('mouseover', function (d) {
                        div.transition()
                            .duration(200)
                            .style('opacity', .9);


                        div.html(d.x + ', ' + roundFilter(d.neutral * 100))
                            .style('left', (d3.event.pageX) + 'px')
                            .style('top', (d3.event.pageY - 30) + 'px');

                        d3.select(this)
                            .style('fill', function (d) { return 'teal' }).transition()
                            .duration(100).attr("r", function (d) { return Math.floor(10) });
                    })
                    .on('mouseout', function (d) {
                        div.transition()
                            .duration(500)
                            .style('opacity', 0);
                        d3.select(this)
                            .style('fill', function (d, i) { return color(i); }).transition()
                            .duration(100).attr('r', function (d) { return 3 });
                    });

                svg
                    .selectAll('circles')
                    .data(arrayMoods)
                    .enter()
                    .append('circle')
                    .attr('cx', function (d) { return xScale(d.x); })
                    .style('fill', function (d, i) { return color(i); })
                    .attr('fill-opacity', 0.5)
                    .attr('cy', function (d) { return yScale(d.fear); })
                    .attr('r', 3)
                    .on('mouseover', function (d) {
                        div.transition()
                            .duration(200)
                            .style('opacity', .9);


                        div.html(d.x + ', ' + roundFilter(d.fear * 100))
                            .style('left', (d3.event.pageX) + 'px')
                            .style('top', (d3.event.pageY - 30) + 'px');

                        d3.select(this)
                            .style('fill', function (d) { return 'teal' }).transition()
                            .duration(100).attr("r", function (d) { return Math.floor(10) });
                    })
                    .on('mouseout', function (d) {
                        div.transition()
                            .duration(500)
                            .style('opacity', 0);
                        d3.select(this)
                            .style('fill', function (d, i) { return color(i); }).transition()
                            .duration(100).attr('r', function (d) { return 3 });
                    });

                svg
                    .selectAll('circles')
                    .data(arrayMoods)
                    .enter()
                    .append('circle')
                    .attr('cx', function (d) { return xScale(d.x); })
                    .style('fill', function (d, i) { return color(i); })
                    .attr('fill-opacity', 0.5)
                    .attr('cy', function (d) { return yScale(d.disgust); })
                    .attr('r', 3)
                    .on('mouseover', function (d) {
                        div.transition()
                            .duration(200)
                            .style('opacity', .9);


                        div.html(d.x + ', ' + roundFilter(d.disgust * 100))
                            .style('left', (d3.event.pageX) + 'px')
                            .style('top', (d3.event.pageY - 30) + 'px');

                        d3.select(this)
                            .style('fill', function (d) { return 'teal' }).transition()
                            .duration(100).attr("r", function (d) { return Math.floor(10) });
                    })
                    .on('mouseout', function (d) {
                        div.transition()
                            .duration(500)
                            .style('opacity', 0);
                        d3.select(this)
                            .style('fill', function (d, i) { return color(i); }).transition()
                            .duration(100).attr('r', function (d) { return 3 });
                    });

                svg
                    .selectAll('circles')
                    .data(arrayMoods)
                    .enter()
                    .append('circle')
                    .attr('cx', function (d) { return xScale(d.x); })
                    .style('fill', function (d, i) { return color(i); })
                    .attr('fill-opacity', 0.5)
                    .attr('cy', function (d) { return yScale(d.anger); })
                    .attr('r', 3)
                    .on('mouseover', function (d) {
                        div.transition()
                            .duration(200)
                            .style('opacity', .9);


                        div.html(d.x + ', ' + roundFilter(d.anger * 100))
                            .style('left', (d3.event.pageX) + 'px')
                            .style('top', (d3.event.pageY - 30) + 'px');

                        d3.select(this)
                            .style('fill', function (d) { return 'teal' }).transition()
                            .duration(100).attr("r", function (d) { return Math.floor(10) });
                    })
                    .on('mouseout', function (d) {
                        div.transition()
                            .duration(500)
                            .style('opacity', 0);
                        d3.select(this)
                            .style('fill', function (d, i) { return color(i); }).transition()
                            .duration(100).attr('r', function (d) { return 3 });
                    });

                svg
                    .selectAll('circles')
                    .data(arrayMoods)
                    .enter()
                    .append('circle')
                    .attr('cx', function (d) { return xScale(d.x); })
                    .style('fill', function (d, i) { return color(i); })
                    .attr('fill-opacity', 0.5)
                    .attr('cy', function (d) { return yScale(d.contempt); })
                    .attr('r', 3)
                    .on('mouseover', function (d) {
                        div.transition()
                            .duration(200)
                            .style('opacity', .9);


                        div.html(d.x + ', ' + roundFilter(d.contempt * 100))
                            .style('left', (d3.event.pageX) + 'px')
                            .style('top', (d3.event.pageY - 30) + 'px');

                        d3.select(this)
                            .style('fill', function (d) { return 'teal' }).transition()
                            .duration(100).attr("r", function (d) { return Math.floor(10) });
                    })
                    .on('mouseout', function (d) {
                        div.transition()
                            .duration(500)
                            .style('opacity', 0);
                        d3.select(this)
                            .style('fill', function (d, i) { return color(i); }).transition()
                            .duration(100).attr('r', function (d) { return 3 });
                    });
            }


        }

    };
});

directives.directive('multiBarChart', function () {
    return {
        restricted: 'E',
        controller: multiBarchartController,
        templateUrl: 'multi-barchart.view.html',
        scope: {
            data: '=',
            options: '=',
            metaDataOne: '=',
            metaDataTwo: '=',
            metaDataThree: '='
        }
    };

    function multiBarchartController($scope, $element, $log, scale0255Filter, roundFilter, propPaisWiseArgmaxFilter, capitalizeFilter) {


        var margin = { top: 20, right: 30, bottom: 30, left: 40 },
            width = 960 - margin.left - margin.right,
            height = 250 - margin.top - margin.bottom;

        let cfgdKeys = _.pluck($scope.options, 'key');
        let cfgdKeysCrspdngData = [];

        _.forEach(cfgdKeys, function (key) {
            cfgdKeysCrspdngData.push(_.pluck($scope.data, key));
        });

        let n = _.size(cfgdKeysCrspdngData[0]); // number of samples
        let m = _.size(cfgdKeys); // number of series
        let ticksVals = _.filter(d3.range(n), function (n) {
            return n % 2 == 0;
        });

        $scope.$watch('data', function () {

            cfgdKeys = _.pluck($scope.options, 'key');
            cfgdKeysCrspdngData = [];

            _.forEach(cfgdKeys, function (key) {
                cfgdKeysCrspdngData.push(_.pluck($scope.data, key));
            });

            n = _.size(cfgdKeysCrspdngData[0]); // number of samples
            m = _.size(cfgdKeys); // number of series

            ticksVals = _.filter(d3.range(n), function (n) {
                return n % 2 == 0;
            });
            updateMultiBarchart(n, m, ticksVals, cfgdKeysCrspdngData, $scope.options);

        }, true)

        var y = d3.scale.linear()
            .domain([0, 100])
            .range([height, 0]);

        var x0 = d3.scale.ordinal()
            .domain(d3.range(n))
            .rangeBands([0, width], .2);

        var x1 = d3.scale.ordinal()
            .domain(d3.range(m))
            .rangeBands([0, x0.rangeBand()]);

        var xAxis = d3.svg.axis()
            .scale(x0)
            .tickValues(ticksVals)
            .orient("bottom")

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")


        var svg = d3.select($element[0])
            .append('div')
            .classed("svg-container", true)
            .attr('class', 'multiBarChart')
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            //.attr("viewBox", "0 0 930 700")
            //class to make it responsive
            .classed("svg-content-responsive", true)
            .attr("width", '100%')//width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("svg:g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var audioElement = document.getElementById('audioElement');
        var audioSrc = audioCtx.createMediaElementSource(audioElement);
        var analyser = audioCtx.createAnalyser();

        // Bind our analyser to the media element source.
        audioSrc.connect(analyser);
        audioSrc.connect(audioCtx.destination);


        var frequencyData = new Uint8Array(200);

        var svgHeight = '300';
        var svgWidth = '960';
        var barPadding = '1';
        let colorMapPositive = d3.interpolateRgb(d3.rgb('#DCEDC8'), d3.rgb('#33691E'));
        let colorMapNegative = d3.interpolateRgb(d3.rgb('#F8BBD0'), d3.rgb('#880E4F'));


        // Create our initial D3 chart.
        d3.select('#audioBarChat').selectAll('rect')
            .data(frequencyData)
            .enter()
            .append('rect')
            .attr('x', function (d, i) {
                return i * (width / frequencyData.length);
            })
            .attr('width', width / frequencyData.length - barPadding);

        // Continuously loop and update chart with frequency data.
        function renderChart() {
            requestAnimationFrame(renderChart);

            // Copy frequency data to frequencyData array.
            analyser.getByteFrequencyData(frequencyData);

            // Update d3 chart with new data.
            d3.select('#audioBarChat').selectAll('rect')
                .data(frequencyData)
                .attr('y', function (d) {
                    return svgHeight - d;
                })
                .attr('height', function (d) {
                    return d;
                })
                .attr('fill', function (d) {
                    //$log.info('$scope.colorNegative', $scope.colorNegative);

                    if ($scope.colorNegative == 1) {
                        return colorMapNegative(scale0255Filter(d));
                    } else {
                        return colorMapPositive(scale0255Filter(d));
                    }

                });
        }

        // Run the loop
        renderChart();

        let audio = document.getElementById('audioElement');
        $scope.play = function () {
            audio.currentTime = 20.0;
            audio.play();
        }

        $scope.pause = function () {
            audio.pause();
        }

        $scope.upVolume = function () {
            audio.volume += 0.1;
        }

        $scope.downVolume = function () {
            audio.volume -= 0.1;
        }

        $scope.resume = function () {
            audio.play();
        }

        let segmentEnd;
        audio.addEventListener('timeupdate', function () {
            if (segmentEnd && audio.currentTime >= segmentEnd) {
                audio.pause();
            }
            console.log(audio.currentTime);
        }, false);

        $scope.playSegment = function (startTime, endTime) {
            segmentEnd = endTime;
            audio.currentTime = startTime;
            audio.play();
        }

        function updateMultiBarchart(n, m, ticksVals, cfgdKeysCrspdngData, chartOptions) {
            x0.domain(d3.range(n));
            x1.domain(d3.range(m))
                .rangeBands([0, x0.rangeBand()]);

            xAxis.tickValues(ticksVals);

            svg.selectAll("rect").transition().remove();

            d3.select(".x")
                .transition()
                .call(xAxis);

            let positiveEmotions = ['happiness', 'surprise'];
            let negativeEmotions = ['sadness', 'disgust', 'contempt', 'fear', 'anger'];

            svg.append("g").selectAll("g")
                .data(cfgdKeysCrspdngData)
                .enter().append("g")
                .style("fill", function (d, i) {
                    return chartOptions[i].color;
                })
                .attr("transform", function (d, i) { return "translate(" + x1(i) + ",0)"; })
                .selectAll("rect")
                .data(function (d, i) {
                    return d;
                })
                .enter().append("rect")
                .attr("width", x1.rangeBand())
                .attr("height", function (d) {
                    return height - y(d)
                })
                .attr("x", function (d, i) { return x0(i); })
                .attr("y", function (d) { return y(d); })
                .on('click', function (d, i) {

                    // get the screenshots 
                    let screenshotBag = $scope.metaDataOne[i];
                    screenshotBag = _.map(screenshotBag, function (object) {
                        return { key: propPaisWiseArgmaxFilter(object.scores)[0], score: propPaisWiseArgmaxFilter(object.scores)[1], screenshot: object.screenshot }
                    });

                    // check whether the the segment is positive or negative
                    // set the color for the audio specter
                    if (_.indexOf(_.pluck($scope.metaDataThree, 'x'), $scope.data[i].x) == -1) {
                        $scope.colorNegative = 0;
                    } else {
                        $scope.colorNegative = 1
                    }

                    $log.info('clicking =====', screenshotBag, $scope.colorNegative);

                    // keep only the the image belonging the segment classification
                    if ($scope.colorNegative == 1) {
                        screenshotBag = _.filter(screenshotBag, function (item) {
                            return _.indexOf(negativeEmotions, item.key.toLowerCase()) !== -1 ? true : false;
                        })
                    } else {
                        screenshotBag = _.filter(screenshotBag, function (item) {
                            return _.indexOf(positiveEmotions, item.key.toLowerCase()) !== -1 ? true : false;
                        })
                    }
                    // play the corresponding audio segment
                    $scope.playSegment($scope.metaDataTwo[i].offset / 1000, ($scope.metaDataTwo[i].offset + $scope.metaDataTwo[i].duration) / 1000);


                    $log.info('clicked', d, screenshotBag);

                    d3.select("#screenshotGallery").selectAll('.owl-carousel').remove();

                    var item = d3.select("#screenshotGallery").append('div')
                        .attr('class', 'owl-carousel owl-theme')
                        .attr('id', 'owl-demo')
                        .selectAll('.item')
                        .data(screenshotBag);

                    item.enter().append('div')
                        .attr('class', 'item')


                    item.exit().remove();

                    item.selectAll('.picture')
                        .data(function (d) { return [d]; })
                        .enter().append('img')
                        .attr('src', function (d) { return './data/imageDir/' + d.screenshot.replace('-cropped', ''); });

                    item.selectAll('.picture-info')
                        .data(function (d) { return [d]; })
                        .enter().append('p')
                        .attr('class', 'item-text')
                        .text(function (d) {
                            return capitalizeFilter(d.key) + ': ' + roundFilter(d.score * 100);
                        })

                    $(document).ready(function () {

                        $("#owl-demo").owlCarousel({
                            //autoPlay: 3000, //Set AutoPlay to 3 seconds
                            //items: 4
                            //itemsDesktop: [1199, 3],
                            //itemsDesktopSmall: [979, 3]
                        });

                    });

                    //$log.info('============== d $$', $scope.data[i], _.indexOf(_.pluck($scope.metaDataThree, 'x'), $scope.data[i].x) == -1);



                })
                .on('mouseover', function (d, i) {


                })
                .on('mouseout', function () {
                    // d3.select($element[0]).selectAll('.gallery').remove();
                    //svg.selectAll('.link').remove();
                })



            function displayScreenshots() {

                var icon_source = "./test3.jpg";
                var links = [
                    { source: ":)", target: "target", icon: icon_source },
                    { source: ":D", target: "target", icon: icon_source },
                    { source: ":(", target: "target", icon: icon_source },
                    { source: ":X", target: "target", icon: icon_source },
                    { source: ":]", target: "target", icon: icon_source }
                ];

                var nodes = {};

                // Compute the distinct nodes from the links.
                links.forEach(function (link) {
                    link.source = nodes[link.source] || (nodes[link.source] = { name: link.source, icon: link.icon });
                    link.target = nodes[link.target] || (nodes[link.target] = { name: link.target, icon: link.icon });
                });

                var force = d3.layout.force()
                    .nodes(d3.values(nodes))
                    .links(links)
                    .size([width, height])
                    .linkDistance(180)
                    .charge(-700)
                    .on("tick", tick)
                    .start();

                var link = svg.selectAll(".link")
                    .data(force.links())
                    .enter().append("line")
                    .attr("class", "link");

                var node = svg.selectAll(".node")
                    .data(force.nodes())
                    .enter().append("g")
                    .attr("class", "node")
                    .on("mouseenter", mouseenter)
                    .on("mouseleave", mouseleave)
                    .call(force.drag);

                node.append("image")
                    .attr("xlink:href", function (d) { return d.icon; })
                    .attr("x", "-12px")
                    .attr("y", "-12px")
                    .attr("width", "80")
                    .attr("height", "80");

                node.append("text")
                    .attr("x", 32)
                    .attr("dy", ".35em")
                    .text(function (d) { return d.name; });

                function tick() {
                    link
                        .attr("x1", function (d) { return d.source.x; })
                        .attr("y1", function (d) { return d.source.y; })
                        .attr("x2", function (d) { return d.target.x; })
                        .attr("y2", function (d) { return d.target.y; });

                    node
                        .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
                }

                function mouseover() {
                    d3.select(this).select("circle").transition()
                        .duration(750)
                        .attr("r", 16);
                }

                function mouseout() {
                    d3.select(this).select("circle").transition()
                        .duration(750)
                        .attr("r", 8);
                }

                function mouseenter() {
                    // select element in current context
                    $log.info('mouseenter', this);

                    d3.select(this)
                        .select('image')
                        .transition()
                        .attr("x", function (d) { return -60; })
                        .attr("y", function (d) { return -60; })
                        .attr("width", 100)
                        .attr("height", 100);
                }

                function mouseleave() {
                    d3.select(this)
                        .select('image')
                        .transition()
                        .attr("x", function (d) { return -25; })
                        .attr("y", function (d) { return -25; })
                        .attr("height", 36)
                        .attr("width", 36);
                }
            }

        }

    }
})

directives.directive('webAudioApi', function () {
    return {
        restricted: 'E',
        controller: webAudioApiController,
        templateUrl: 'web-audio-api.view.html'
    }

    function webAudioApiController($scope, $element, $log, scale0255Filter) {
        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var audioElement = document.getElementById('audioElement');
        var audioSrc = audioCtx.createMediaElementSource(audioElement);
        var analyser = audioCtx.createAnalyser();

        // Bind our analyser to the media element source.
        audioSrc.connect(analyser);
        audioSrc.connect(audioCtx.destination);


        var frequencyData = new Uint8Array(200);

        var svgHeight = '300';
        var svgWidth = '1200';
        var barPadding = '1';

        function createSvg(parent, height, width) {
            return d3.select(parent).append('svg').attr('height', height).attr('width', width);
        }

        var svg = createSvg($element[0], svgHeight, svgWidth);

        // Create our initial D3 chart.
        svg.selectAll('rect')
            .data(frequencyData)
            .enter()
            .append('rect')
            .attr('x', function (d, i) {
                return i * (svgWidth / frequencyData.length);
            })
            .attr('width', svgWidth / frequencyData.length - barPadding);

        // Continuously loop and update chart with frequency data.
        function renderChart() {
            requestAnimationFrame(renderChart);

            // Copy frequency data to frequencyData array.
            analyser.getByteFrequencyData(frequencyData);

            let colorMapPositive = d3.interpolateRgb(d3.rgb('#DCEDC8'), d3.rgb('#33691E'));
            let colorMapNegative = d3.interpolateRgb(d3.rgb('#F8BBD0'), d3.rgb('#880E4F'));

            $log.info('colorMapPositive', colorMapPositive);

            // Update d3 chart with new data.
            svg.selectAll('rect')
                .data(frequencyData)
                .attr('y', function (d) {
                    return svgHeight - d;
                })
                .attr('height', function (d) {
                    return d;
                })
                .attr('fill', function (d) {
                    $log.info('d=========', d);

                    return colorMapPositive(scale0255Filter(d));
                });
        }

        // Run the loop
        renderChart();

        analyser.fftSize = 2048;
        var tailleMemoireTampon = analyser.frequencyBinCount;
        var tableauDonnees = new Uint8Array(tailleMemoireTampon);
        var audioData = analyser.getByteTimeDomainData(tableauDonnees);
        $log.info('tableauDonnees', audioData);


        // dessine un oscilloscope de la source audio

        let audio = document.getElementById('audioElement');
        $scope.play = function () {
            audio.currentTime = 20.0;
            audio.play();
        }

        $scope.pause = function () {
            audio.pause();
        }

        $scope.upVolume = function () {
            audio.volume += 0.1;
        }

        $scope.downVolume = function () {
            audio.volume -= 0.1;
        }

        let segmentEnd;
        audio.addEventListener('timeupdate', function () {
            if (segmentEnd && audio.currentTime >= segmentEnd) {
                audio.pause();
            }
            console.log(audio.currentTime);
        }, false);

        $scope.playSegment = function (startTime, endTime) {
            segmentEnd = endTime;
            audio.currentTime = startTime;
            audio.play();
        }
    }
});