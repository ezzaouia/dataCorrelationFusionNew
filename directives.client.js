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
                    $scope.segmentData = $scope.data[i];
                    $scope.changeHandler($scope.segmentData);
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
        bindToController: true,
        controllerAs: 'vm',
        scope: {
            data: '=',
            options: '='
        }
    };

    function multiBarchartController($scope, $element, $log, scale0255Filter, roundFilter, propPaisWiseArgmaxFilter, capitalizeFilter, scale0255To100Filter) {
        let vm = this;
        var margin = { top: 10, right: 0, bottom: 20, left: 25, legend: 40 },
            width = 180 - margin.left - margin.right,
            height = 150 - margin.top - margin.bottom;

        let cfgdKeys = _.pluck(vm.options, 'key');
        let cfgdKeysCrspdngData = [];

        _.forEach(cfgdKeys, function (key) {
            cfgdKeysCrspdngData.push(_.pluck(vm.data, key));
        });

        let n = _.size(cfgdKeysCrspdngData[0]); // number of samples
        let m = _.size(cfgdKeys); // number of series
        let ticksVals = _.filter(d3.range(n), function (n) {
            return 'a'//n % 2 == 0;
        });

        $log.info('vm ==== =data', vm.data);


        $scope.$watch('vm.data', function () {

            cfgdKeys = _.pluck(vm.options.bars, 'key');
            cfgdKeysCrspdngData = [];

            _.forEach(cfgdKeys, function (key) {
                cfgdKeysCrspdngData.push(_.pluck(vm.data, key));
            });

            n = _.size(cfgdKeysCrspdngData[0]); // number of samples
            m = _.size(cfgdKeys); // number of series

            ticksVals = _.filter(d3.range(n), function (n) {
                return n % 2 == 0;
            });

            updateMultiBarchart(n, m, ticksVals, cfgdKeysCrspdngData, vm.options);

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
            //.tickValues([ticksVals])
            .tickFormat(function (d/*, i*/) {
                return vm.options.ticks[d];
            })
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");


        var svg = d3.select($element[0])
            .append('div')
            //.classed("svg-container", true)
            .attr('class', 'multiBarChart')
            .append("svg")
            //.attr("preserveAspectRatio", "xMinYMin meet")
            //.attr("viewBox", "0 0 930 700")
            //class to make it responsive
            //.classed("svg-content-responsive", true)
            .attr("width", width + margin.left + margin.right + margin.legend)
            .attr("height", height + margin.top + margin.bottom)
            .append("svg:g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 3)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Score");

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);


        function updateMultiBarchart(n, m, ticksVals, cfgdKeysCrspdngData, chartOptions) {
            x0.domain(d3.range(n));
            x1.domain(d3.range(m))
                .rangeBands([0, x0.rangeBand()]);

            // xAxis.tickValues(ticksVals);

            svg.selectAll(".bar-rect").transition().remove();

            svg.select(".x")
                .transition()
                .call(xAxis);

            svg.append("g").selectAll("g")
                .data(cfgdKeysCrspdngData)
                .enter().append("g")
                .style("fill", function (d, i) {
                    return chartOptions.bars[i].color;
                })
                .attr("transform", function (d, i) { return "translate(" + x1(i) + ",0)"; })
                .selectAll("rect")
                .data(function (d, i) {
                    return d;
                })
                .enter()
                .append("rect")
                .attr('class', 'bar-rect')
                .attr("width", x1.rangeBand())
                .attr("height", function (d) {
                    return height - y(d)
                })
                .attr("x", function (d, i) { return x0(i); })
                .attr("y", function (d) { return y(d); })
        }

        buildMultiBartChartLegend(vm.options.bars);

        function buildMultiBartChartLegend(data) {
            // adding legend
            var legend = svg.selectAll(".legend")
                .data(data)
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function (d, i) { return "translate(0," + i * 10 + ")"; });

            legend.append("rect")
                .attr("x", width + 35)
                .attr("width", 5)
                .attr("height", 5)
                .style("fill", function (d) {
                    return d.color;
                });

            legend.append("text")
                .attr("x", width + 30)
                .attr("y", 5 - 5 / 2) // to aling it with rect
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function (d) { return d.label; });
        }

    }
})

directives.directive('multiBarChartNew', function () {
    return {
        restricted: 'E',
        controller: multiBarchartController,
        bindToController: true,
        controllerAs: 'vm2',
        scope: {
            data: '=',
            options: '='
        }
    };

    function multiBarchartController($scope, $element, $log, scale0255Filter, roundFilter, propPaisWiseArgmaxFilter, capitalizeFilter, scale0255To100Filter) {
        let vm2 = this;
        var margin = { top: 10, right: 0, bottom: 20, left: 25, legend: 40 },
            width = 180 - margin.left - margin.right,
            height = 150 - margin.top - margin.bottom;

        let cfgdKeys = _.pluck(vm2.options, 'key');
        let cfgdKeysCrspdngData = [];

        _.forEach(cfgdKeys, function (key) {
            cfgdKeysCrspdngData.push(_.pluck(vm2.data, key));
        });

        let n = _.size(cfgdKeysCrspdngData[0]); // number of samples
        let m = _.size(cfgdKeys); // number of series
        let ticksVals = _.filter(d3.range(n), function (n) {
            return n % 2 == 0;
        });

        $scope.$watch('vm2.data', function () {

            cfgdKeys = _.pluck(vm2.options.bars, 'key');
            cfgdKeysCrspdngData = [];

            _.forEach(cfgdKeys, function (key) {
                cfgdKeysCrspdngData.push(_.pluck(vm2.data, key));
            });

            n = _.size(cfgdKeysCrspdngData[0]); // number of samples
            m = _.size(cfgdKeys); // number of series

            updateMultiBarchart(n, m, ticksVals, cfgdKeysCrspdngData, vm2.options);
        }, true)

        var y = d3.scale.linear()
            .domain([-100, 100])
            .range([height, 0]);

        var x0 = d3.scale.ordinal()
            .domain(d3.range(n))
            .rangeBands([0, width], .2);

        var x1 = d3.scale.ordinal()
            .domain(d3.range(m))
            .rangeBands([0, x0.rangeBand()]);

        var xAxis = d3.svg.axis()
            .scale(x0)
            .tickFormat(function (d/*, i*/) {
                return vm2.options.ticks[d];
            })
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");


        var svg = d3.select($element[0])
            .append('div')
            //.classed("svg-container", true)
            .attr('class', 'multiBarChart')
            .append("svg")
            //.attr("preserveAspectRatio", "xMinYMin meet")
            //.attr("viewBox", "0 0 930 700")
            //class to make it responsive
            //.classed("svg-content-responsive", true)
            .attr("width", width + margin.left + margin.right + margin.legend)
            .attr("height", height + margin.top + margin.bottom)
            .append("svg:g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 3)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Score");

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);


        function updateMultiBarchart(n, m, ticksVals, cfgdKeysCrspdngData, chartOptions) {
            x0.domain(d3.range(n));
            x1.domain(d3.range(m))
                .rangeBands([0, x0.rangeBand()]);

            // xAxis.tickValues(ticksVals);

            svg.selectAll(".bar-rect").transition().remove();

            svg.select(".x")
                .transition()
                .call(xAxis);

            svg.append("g").selectAll("g")
                .data(cfgdKeysCrspdngData)
                .enter().append("g")
                .style("fill", function (d, i) {
                    return chartOptions.bars[i].color;
                })
                .attr("transform", function (d, i) { return "translate(" + x1(i) + ",0)"; })
                .selectAll("rect")
                .data(function (d, i) {
                    return d;
                })
                .enter()
                .append("rect")
                .attr('class', 'bar-rect')
                .attr("width", x1.rangeBand())
                .attr("height", function (d) {
                    return Math.abs(y(d) - y(0));
                })
                .attr("x", function (d, i) { return x0(i); })
                .attr("y", function (d) { return y(Math.max(0, d)); })
        }

        buildMultiBartChartLegend(vm2.options.bars);

        function buildMultiBartChartLegend(data) {
            // adding legend
            var legend = svg.selectAll(".legend")
                .data(data)
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function (d, i) { return "translate(0," + i * 10 + ")"; });

            legend.append("rect")
                .attr("x", width + 35)
                .attr("width", 5)
                .attr("height", 5)
                .style("fill", function (d) {
                    return d.color;
                });

            legend.append("text")
                .attr("x", width + 30)
                .attr("y", 5 - 5 / 2) // to aling it with rect
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function (d) { return d.label; });
        }


    }
})


directives.directive('radarChart', function () {

    return {
        restricted: 'E',
        controller: radarChartController,
        templateUrl: 'radar-chart.view.html',
        controllerAs: 'radarChartCtrl',
        bindToController: true,
        scope: {
            data: '=',
            options: '=',
            metaData: '='
        }
    }

    function radarChartController($scope, $element, $log, roundFilter, capitalizeFilter) {
        let radarChartCtrl = this;
        let videObject = [
            { axis: 'Neutral', value: 0.0 },
            { axis: 'Anger', value: 0 },
            { axis: 'Sadness', value: 0 },
            { axis: 'Happiness', value: 0 },
            { axis: 'Contempt', value: 0 },
            { axis: 'Fear', value: 0 },
            { axis: 'Surprise', value: 0 },
            { axis: 'Disgust', value: 0 }];
        // watch for any change and draw the chart radar
        $scope.$watch('radarChartCtrl.metaData', function () {
            let mappedMetaData = null;
            if (_.size(radarChartCtrl.metaData)) {
                //  Call function to draw the Radar chart
                $log.info('radarChartCtrl.metaData', radarChartCtrl.metaData);

                RadarChart('.radarChart', [radarChartCtrl.metaData], radarChartCtrl.options);
            } else {
                RadarChart('.radarChart', videObject, radarChartCtrl.options);
            }
        }, true);
    }
});

directives.directive('pieChartDonut', function () {

    return {
        restricted: 'E',
        controller: pieChartController,
        // templateUrl: 'radar-chart.view.html',
        controllerAs: 'pieChartCtrl',
        bindToController: true,
        scope: {
            data: '=',
            options: '=',
            metaData: '='
        }
    }

    function pieChartController($scope, $element, $log, roundFilter, capitalizeFilter, scale0100To01Filter) {
        let pieChartCtrl = this;
        $scope.globalData = null;
        // watch for any change and draw the chart radar
        $scope.$watch('pieChartCtrl.data', function () {
            $scope.globalData = pieChartCtrl.data;
            render();
        }, true);

        var margin = { top: 3, right: 3, bottom: 3, left: 3, title: 10 },
            width = 130,
            height = 120

        // set the thickness of the inner and outer radii
        var min = Math.min(width, height);
        var oRadius = min / 2 * 0.9;
        var iRadius = min / 2 * .85;
        // construct default pie laoyut
        var pie = d3.layout.pie().value(function (d) { return d.value; }).sort(null);
        // construct arc generator
        var arc = d3.svg.arc()
            .outerRadius(oRadius)
            .innerRadius(iRadius);

        var color = d3.scale.category20();
        // draw and append the container
        var svg = d3.select($element[0])
                .append('div')
            .append("svg")
            //.attr("preserveAspectRatio", "xMinYMin meet")
            //.attr("viewBox", "0 0 930 700")
            //class to make it responsive
            //.classed("svg-content-responsive", true)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.bottom + margin.top + margin.title)
            .append("g")
            .attr("transform", "translate(" +  (width / 2 ) + "," +  (height / 2) + ")");

            svg.append("g")
            .append("text")
            .attr("text-anchor", "middle")
            .attr("y", height / 2 + margin.title)
            .text("Pie Chart - Video");

        // enter data and draw pie chart
        var path = svg.datum(pieChartCtrl.data).selectAll("path")
            .data(pie)
            .enter().append("path")
            .attr("class", "piechart")
            .attr("fill", function (d, i) {
                $log.info('color', d.data.color);

                return d.data.color;
            })
            .attr("d", arc)
            .each(function (d) {
                this._current = d;
            })

        

        var colorRange = d3.scale.category20();
        var color = d3.scale.ordinal()
            .range(colorRange.range());
        var legendRectSize = 5;
        var legendSpacing = 4;
        var legendHeight = legendRectSize + legendSpacing;



        function render() {
            // generate new random data
            //data = makeData(4);
            // add transition to new path
            svg.datum(pieChartCtrl.data).selectAll("path").data(pie).transition().duration(700).attrTween("d", arcTween)
            // add any new paths
            svg.datum(pieChartCtrl.data).selectAll("path")
                .data(pie)
                .enter().append("path")
                .attr("class", "piechart")
                .attr("fill", function (d, i) { return d.data.color; })
                .attr("d", arc)
                .each(function (d) { this._current = d; })
            // remove data not being used
            svg.datum(pieChartCtrl.data).selectAll("path")
                .data(pie).exit().remove();

            buildPieChartLegend($scope.globalData || []);

        }
        render();

        // Store the displayed angles in _current.
        // Then, interpolate from _current to the new angles.
        // During the transition, _current is updated in-place by d3.interpolate.
        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function (t) {
                return arc(i(t));
            };
        }


        function buildPieChartLegend(data) {
            // adding legend
            var legend = svg.selectAll(".legend")
                .data(data)
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function (d, i) { return "translate(0," + i * 10 + ")"; });

            legend.append("rect")
                .attr("x", 25 )
                .attr("y", -2)
                .attr("width", 5)
                .attr("height", 5)
                 .style("text-anchor", "middle")
                .style("fill", function (d) {
                    return d.color;
                });

            legend.append("text")
                //.attr("x", 13)
                //.attr("y",  5 / 2)
                .attr("dy", ".25em")
                .style("text-anchor", "middle")
                .text(function (d) { return d.label; });
        }

    }
});

directives.directive('emotionalTimeLinePlayerChartOld', function () {
    return {
        restricted: 'E',
        controller: emotionalTimeLinePlayerController,
        templateUrl: 'emotionalTimeLinePlayerChart.view.html',
        bindToController: true,
        controllerAs: 'vm',
        scope: {
            data: '=',
            options: '=',
            videoTpData: '=',
            videoTnData: '=',
            audioMetaData: '=',
            videoMetaData: '='
        }
    };

    function emotionalTimeLinePlayerController($scope, $element, $log, timeToStrFilter, timeToDateFilter, scale0255To100Filter, scale0255Filter, roundFilter, capitalizeFilter, propPaisWiseArgmaxFilter) {
        let vm = this;
        vm.globalData = [];

        $scope.$watch('vm.videoTpData', function () {
            vm.globalData = [];
            _.forEach(vm.videoTpData, function (item) {
                $log.info('_.find(vm.videoTpData, {x: 40})', _.find(vm.videoTpData, { x: 42 }));

                vm.globalData.push({
                    x: item.x,
                    key: 'positive',
                    value: item.positive,
                    offset: vm.audioMetaData[item.x].offset,
                    duration: vm.audioMetaData[item.x].duration
                })
            });

            // _.forEach(vm.videoTnData, function (item) {
            //     vm.globalData.push({
            //         x: item.x,
            //         key: 'negative',
            //         value: item.negative,
            //         offset: vm.audioMetaData[item.x].offset,
            //         duration: vm.audioMetaData[item.x].duration
            //     })
            // });

            updateEmotionalTimeLinePlayerChart();
        }, true);

        var margin = { top: 20, right: 30, bottom: 20, left: 30 },
            width = 1000 - margin.left - margin.right,
            height = 180 - margin.top - margin.bottom;

        // y scale
        var y = d3.scale.linear()
            .domain([0, 100])
            .range([height, 0]);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var rScale = d3.scale.linear()
            .range([2, 7]);

        // x axis
        var x = d3.time.scale()
            .domain([0, 47 * 60 * 1000])
            .range([0, width]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(d3.time.minute, 10)
            .tickFormat(d3.time.format('%M:%S'));

        // here the main svg
        var svg = d3.select($element[0])
            .select('#timeLine')
            .append("svg")
            .attr("width", width)
            .attr("height", height + margin.top + margin.bottom)
            .append("svg:g")
            .attr('class', 'g_main')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // adding axis x & y the svg
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        let positiveEmotions = ['happiness', 'surprise'];
        let negativeEmotions = ['sadness', 'disgust', 'contempt', 'fear', 'anger'];

        let audio = null;
        let segmentEnd;
        let bubbles = null;

        updateEmotionalTimeLinePlayerChart();

        function updateEmotionalTimeLinePlayerChart() {
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
            audio = document.getElementById('audioElement');
            audio.addEventListener('timeupdate', function () {
                if (segmentEnd && audio.currentTime >= segmentEnd) {
                    audio.pause();
                }
            }, false);

            rScale.domain([0, d3.max(vm.globalData, function (d) { return d.value; })])
            svg.selectAll("line").transition(700).remove()
            svg.selectAll("circle").transition(700).remove()

            // draw 
            // ver lines
            // svg.selectAll("vline")
            //     .data(vm.globalData)
            //     .enter().append("line")
            //     .attr("class", "x")
            //     .style("stroke", "blue")
            //     .style("stroke-dasharray", "3,3")
            //     .style("opacity", 0.5)
            //     .attr("y1", function (d) { return y(d.value) + rScale(d.value) })
            //     .attr("y2", height)
            //     .attr("x1", function (d) { return x(d.offset) + x(d.duration / 2) })
            //     .attr("x2", function (d) { return x(d.offset) + x(d.duration / 2) })

            // // // hor lines
            // svg.selectAll("hline")
            //     .data(vm.globalData)
            //     .enter().append("line")
            //     .attr("class", "x")
            //     .style("stroke", "blue")
            //     //.style("stroke-dasharray", "2,2")
            //     .style('stroke-width', '3')
            //     .style("opacity", 0.5)
            //     .attr("y1", height)
            //     .attr("y2", height)
            //     .attr("x1", function (d) { return x(d.offset); })
            //     .attr("x2", function (d) { return x(d.offset) + x(d.duration); })
            //     .on('click', onClickBubble)

            // draw bubbles
            svg.append('g').selectAll("circle")
                .data(vm.globalData)
                .enter().append("svg:circle")
                .style('fill', function (d) {
                    return 'red'//_.find(vm.options, { key: d.key }).color;
                })
                .attr("r", function (d) {
                    return rScale(d.value)
                })
                .attr("cx", function (d) {
                    return x(d.offset) //+ x(d.duration / 2);
                })
                .attr("cy", function (d) {
                    $log.info('d============', d);

                    return y(d.value);
                })

            svg.selectAll("circle")
                .on('click', onClickBubble)

            // svg.selectAll(".bubble")
            //     .on('mouseover', onClickBubble)
        }

        function onClickBubble(d, i) {
            $log.info('d======== click', d);

            // play the corresponding audio segment
            // ------------------------------------
            vm.playSegment(d.offset / 1000, (d.offset + d.duration) / 1000);

            // display screenshots
            // 1. get the screenshots 
            vm.screenshotBag = vm.videoMetaData[d.x];
            vm.screenshotBag = _.map(vm.screenshotBag, function (object) {
                return { key: propPaisWiseArgmaxFilter(object.scores)[0], score: propPaisWiseArgmaxFilter(object.scores)[1], screenshot: object.screenshot }
            });

            // 2. check whether the the segment is positive or negative
            // set the color for the audio specter
            if (d.key == 'negative') {
                vm.colorNegative = 0;
            } else {
                vm.colorNegative = 1
            }

            // 3. keep only the the image belonging the segment classification
            if (vm.colorNegative == 0) {
                vm.screenshotBag = _.filter(vm.screenshotBag, function (item) {
                    return _.indexOf(negativeEmotions, item.key.toLowerCase()) !== -1 ? true : false;
                })
            } else {
                vm.screenshotBag = _.filter(vm.screenshotBag, function (item) {
                    return _.indexOf(positiveEmotions, item.key.toLowerCase()) !== -1 ? true : false;
                })
            }

            // 4. put images into carousel #screenshotGallery
            d3.select("#screenshotGallery").selectAll('.bx-wrapper').remove();

            $log.info('vm.screenshotBag', vm.screenshotBag);

            var item = d3.select("#screenshotGallery")
                .append('div')
                .attr('class', 'slider-carousel')
                .selectAll('.slide')
                .data(vm.screenshotBag);

            item.enter().append('div')
                .attr('class', 'slide')


            item.exit().remove();

            item.selectAll('.picture')
                .data(function (d) { return [d]; })
                .enter().append('img')
                //.attr('height', '120px')
                //.attr('width', '120px')
                .attr('src', function (d) { return './data/imageDir/' + d.screenshot.replace('-cropped', ''); });

            item.selectAll('.picture-info')
                .data(function (d) { return [d]; })
                .enter().append('span')
                .attr('class', 'item-text')
                .text(function (d) {
                    return capitalizeFilter(d.key) + ': ' + roundFilter(d.score * 100) + '%';
                })

            $(document).ready(function () {
                let slider = $('.slider-carousel').bxSlider({
                    //slideWidth: 100,
                    minSlides: 2,
                    maxSlides: 6,
                    slideMargin: 10,
                    //preloadImages: 'all',
                    touchEnabled: false
                });
                slider.reloadSlider();
            });
        }

    }

})


directives.directive('emotionalTimeLineChart', function () {
    return {
        restricted: 'E',
        controller: emotionalTimeLineController,
        //templateUrl: 'emotionalTimeLineChart.view.html',
        bindToController: true,
        controllerAs: 'vm',
        scope: {
            data: '=',
            options: '=',
            videoTpData: '=',
            videoTnData: '=',
            audioMetaData: '=',
            videoMetaData: '=',
            onClickHandler: '=',
            onMouseenterHandler: '='
        }
    };

    function emotionalTimeLineController($scope, $element, $log, timeToStrFilter, $interval, timeToDateFilter, scale0255To100Filter, scale0255Filter, roundFilter, capitalizeFilter, propPaisWiseArgmaxFilter) {
        let vm = this;
        vm.globalData = [];

        $scope.$watch('vm.videoTpData + vm.videoTnData', function () {
            vm.globalData = [];
            _.forEach(vm.videoTpData, function (item) {
                vm.globalData.push({
                    x: item.x,
                    key: 'positive',
                    value: item.positive,
                    offset: vm.audioMetaData[item.x].offset,
                    duration: vm.audioMetaData[item.x].duration
                })
            });

            _.forEach(vm.videoTnData, function (item) {
                vm.globalData.push({
                    x: item.x,
                    key: 'negative',
                    value: item.negative,
                    offset: vm.audioMetaData[item.x].offset,
                    duration: vm.audioMetaData[item.x].duration
                })
            });

            // update chart
            updateEmotionalTimeLineChart()
        });

        var margin = { top: 7, right: 40, bottom: 17, left: 30 },
            width = 1000 - margin.left - margin.right,
            height = 100 - margin.top - margin.bottom;

        // y scale
        var y = d3.scale.linear()
            .domain([0, 100])
            .range([height, 0]);

        var yAxis = d3.svg.axis()
            .scale(y)
            .ticks(5)
            .orient("left");

        var rScale = d3.scale.linear()
            .range([2, 7]);

        // x axis
        var x = d3.time.scale()
            .domain([0, 47 * 60 * 1000])
            .range([0, width]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(d3.time.minute, 10)
            .tickFormat(d3.time.format('%M:%S'));

        // here the main svg
        var svg = d3.select($element[0])
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr('class', 'g_main')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // adding axis x & y the svg
        let g = svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 3)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Score")



        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate(" + (width - margin.right) + "," + -2 + ")")  // centre below axis
            .text("Time (min)");


        function updateEmotionalTimeLineChart() {

            rScale.domain([0, d3.max(vm.globalData, function (d) { return d.value; })])
            svg.selectAll(".timeline-vline").remove()
            svg.selectAll(".timeline-hline").remove()
            svg.selectAll("circle").remove()

            // draw 
            // ver lines
            svg.selectAll("vline")
                .data(vm.globalData)
                .enter().append("line")
                .attr("class", "timeline-vline")
                .style("stroke", "blue")
                .style("stroke-dasharray", "3,3")
                .style("opacity", 0.5)
                .attr("y1", function (d) { return y(d.value) + rScale(d.value) })
                .attr("y2", height)
                .attr("x1", function (d) { return x(d.offset) + x(d.duration / 2) })
                .attr("x2", function (d) { return x(d.offset) + x(d.duration / 2) })
                .on('mouseover', onClickBubble)
            // // // hor lines
            svg.selectAll("hline")
                .data(vm.globalData)
                .enter().append("line")
                .attr("class", "timeline-hline")
                .style("stroke", "blue")
                //.style("stroke-dasharray", "2,2")
                .style('stroke-width', '3')
                .style("opacity", 0.5)
                .attr("y1", height)
                .attr("y2", height)
                .attr("x1", function (d) { return x(d.offset); })
                .attr("x2", function (d) { return x(d.offset) + x(d.duration); })
            //.on('click', onClickBubble)

            // draw bubbles
            svg.selectAll("circle")
                .data(vm.globalData)
                .enter().append("circle")
                .attr("class", "dot")
                .style('fill', function (d) {
                    return _.find(vm.options, { key: d.key }).color;
                })
                .attr("r", function (d) {
                    return rScale(d.value)
                })
                .attr("cx", function (d) {
                    return x(d.offset) + x(d.duration / 2);
                })
                .attr("cy", function (d) {
                    return y(d.value);
                })

                // attaching events 
                .on('click', onClickBubble)
                .on('mouseenter', onMouseenterBubble)

        }

        let positiveEmotions = ['happiness', 'surprise'];
        let negativeEmotions = ['sadness', 'disgust', 'contempt', 'fear', 'anger'];
        // on mouseenter
        function onMouseenterBubble(d, i) {
            // 1. get the screenshots 
            vm.screenshotBag = vm.videoMetaData[d.x];
            vm.screenshotBag = _.map(vm.screenshotBag, function (object) {
                return { key: propPaisWiseArgmaxFilter(object.scores)[0], score: propPaisWiseArgmaxFilter(object.scores)[1], screenshot: object.screenshot }
            });

            // 2. keep only the the image belonging the segment classification
            if (d.key == 'positive') {
                vm.screenshotBag = _.filter(vm.screenshotBag, function (item) {
                    return _.indexOf(positiveEmotions, item.key.toLowerCase()) !== -1 ? true : false;
                });
            } else {
                vm.screenshotBag = _.filter(vm.screenshotBag, function (item) {
                    return _.indexOf(negativeEmotions, item.key.toLowerCase()) !== -1 ? true : false;
                });
            }

            if (vm.onMouseenterHandler) {
                vm.onMouseenterHandler(d, vm.screenshotBag);
            }
        }

        // on click
        function onClickBubble(d, i) {

            if (vm.onClickHandler) {
                vm.onClickHandler(d);
            }
        }

        buildMultiBartChartLegend(vm.options);

        function buildMultiBartChartLegend(data) {
            // adding legend
            var legend = svg.selectAll(".legend")
                .data(data)
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function (d, i) { return "translate(0," + i * 10 + ")"; });

            legend.append("rect")
                .attr("x", width + 35)
                .attr("width", 5)
                .attr("height", 5)
                .style("fill", function (d) {
                    return d.color;
                });

            legend.append("text")
                .attr("x", width + 30)
                //.style('font-size', '7px')
                .attr("y", 5 - 5 / 2) // to aling it with rect
                .attr("dy", ".25em")
                .style("text-anchor", "end")
                .text(function (d) { return capitalizeFilter(d.key); });
        }
    }
})

directives.directive('timeLineChart', function () {
    return {
        restricted: 'E',
        controller: emotionalTimeLineController,
        bindToController: true,
        controllerAs: 'vm',
        scope: {
            data: '=',
            options: '=',
            videoTimeSeries: '=',
            audioMetaData: '='

        }
    };

    function emotionalTimeLineController($scope, $element, $log, timeToStrFilter, $interval, timeToDateFilter, scale0255To100Filter, scale0255Filter, roundFilter, capitalizeFilter, propPaisWiseArgmaxFilter) {
        let vm = this;
        vm.globalData = {};
        $scope.$watch('vm.data', function () {


            vm.globalData = {};
            // map data by keys
            _.forEach(vm.data, function (item) {
                _.map(item, function (v, k) {
                    (vm.globalData[k] = (vm.globalData[k] || [])).push({
                        value: v,
                        x: item.x,
                        offset: vm.audioMetaData[item.x].offset,
                        duration: vm.audioMetaData[item.x].duration
                    });
                });
            });

            vm.globalData = _.omit(vm.globalData, 'x');
            vm.globalData = _.map(vm.globalData, function (value, key) {
                return { key: key, values: value };
            });

            $log.info('vm.data ==== line chart', vm.data, vm.globalData);


            // update chart
            updateEmotionalTimeLineChart()
        });


        var margin = { top: 7, right: 40, bottom: 17, left: 30 },
            width = 1000 - margin.left - margin.right,
            height = 100 - margin.top - margin.bottom;

        // y scale
        var y = d3.scale.linear()
            .domain([0, 100])
            .range([height, 0]);

        var yAxis = d3.svg.axis()
            .scale(y)
            .ticks(5)
            .orient("left");

        // x axis
        var x = d3.time.scale()
            .domain([0, 47 * 60 * 1000])
            .range([0, width]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(d3.time.minute, 10)
            .tickFormat(d3.time.format('%M:%S'));

        // Define the line
        var emotionLine = d3.svg.line()
            .interpolate("cardinal")
            .x(function (d) { return x(d.offset) + x(d.duration / 2); })
            .y(function (d) { return y(d.value); });


        // here the main svg
        var svg = d3.select($element[0])
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr('class', 'g_main')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        // adding axis x & y the svg
        let g = svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 3)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Score");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 3)
            .attr("dy", "1.71em")
            .style("text-anchor", "end")
            .text("Top 3")

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate(" + (width - margin.right) + "," + -2 + ")")  // centre below axis
            .text("Time (min)");


        function updateEmotionalTimeLineChart() {
            //x.domain(d3.extent(data, function (d) { return d.date; }));
            //y.domain([0, d3.max(data, function (d) { return d.price; })]);

            vm.globalData.forEach(function (d) {
                svg.append("path")
                    .attr("class", "emotion-line")
                    .style("stroke", _.find(vm.options.bars, { key: d.key }).color)
                    .style("stroke-width", 1.5)
                    //.style("opacity", 0.4)
                    .attr('fill', 'none')//_.find(vm.options.bars, {key: d.key}).color)
                    .attr("d", emotionLine(d.values));

            });
        }

        buildMultiBartChartLegend(vm.options.bars);

        function buildMultiBartChartLegend(data) {
            // adding legend
            var legend = svg.selectAll(".legend")
                .data(data)
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function (d, i) { return "translate(0," + i * 10 + ")"; });

            legend.append("rect")
                .attr("x", width + 35)
                .attr("width", 3)
                .attr("height", 3)
                .style("fill", function (d) {
                    return d.color;
                });

            legend.append("text")
                .attr("x", width + 30)
                .style('font-size', '7px')
                .attr("y", 5 - 5 / 2) // to aling it with rect
                .attr("dy", ".25em")
                .style("text-anchor", "end")
                .text(function (d) { return d.label; });
        }
    }
})


directives.directive('emotionalTimeLinePlayerChart', function () {
    return {
        restricted: 'E',
        controller: emotionalTimeLinePlayerChartController,
        templateUrl: 'emotionalTimeLinePlayerChart.view.html',
        bindToController: true,
        controllerAs: 'vm',
        scope: {
            data: '=',
            options: '='
        }
    };

    function emotionalTimeLinePlayerChartController($scope, $element, $log, timeToStrFilter, $interval, timeToDateFilter, scale0255To100Filter, scale0255Filter, roundFilter, capitalizeFilter, propPaisWiseArgmaxFilter) {
        let vm = this;
        let audio = document.getElementById('audioElement');
        $scope.$watch('vm.data', function () {
            $log.info('palyerrrrrr watch', vm);

            // update chart
            if (_.size(vm.data)) {
                vm.playSegment(Number(vm.data.offset) / 1000, (Number(vm.data.offset) + Number(vm.data.duration)) / 1000)
            }

        }, true);

        // -----------------------
        // audio controlling
        // -----------------------
        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var audioElement = document.getElementById('audioElement');
        var audioSrc = audioCtx.createMediaElementSource(audioElement);
        var analyser = audioCtx.createAnalyser();

        // Bind our analyser to the media element source.
        audioSrc.connect(analyser);
        audioSrc.connect(audioCtx.destination);


        var frequencyData = new Uint8Array(200);

        var svgHeight = '50';
        var svgWidth = '500';
        var barPadding = '1';
        let colorMapPositive = d3.interpolateRgb(d3.rgb('#DCEDC8'), d3.rgb('#33691E'));
        let colorMapNegative = d3.interpolateRgb(d3.rgb('#F8BBD0'), d3.rgb('#880E4F'));

        // adding d3 bar chart
        d3.select('#audioBarChat').selectAll('rect')
            .data(frequencyData)
            .enter()
            .append('rect')
            .attr('x', function (d, i) {
                return i * (svgWidth / frequencyData.length);
            })
            .attr('width', svgWidth / frequencyData.length - barPadding)
            .attr('height', svgHeight);

        // Continuously loop and update chart with frequency data.
        function renderChart() {
            requestAnimationFrame(renderChart);

            // Copy frequency data to frequencyData array.
            analyser.getByteFrequencyData(frequencyData);

            // Update d3 chart with new data.
            d3.select('#audioBarChat').selectAll('rect')
                .data(frequencyData)
                .attr('y', function (d) {
                    return svgHeight - scale0255To100Filter(d);
                })
                .attr('height', function (d) {
                    return d;
                })
                .attr('fill', function (d) {

                    if (vm.data.key === 'negative') {
                        return colorMapNegative(scale0255Filter(d));
                    } else {
                        return colorMapPositive(scale0255Filter(d));
                    }

                });
        }

        // Run the loop
        renderChart();

        vm.play = function () {
            audio.currentTime = 20.0;
            audio.play();
        }
        let audioTimeupdateListener
        vm.pause = function () {
            audio.pause();
            // audio.removeEventListener('timeupdate', audioTimeupdateListener);
        }

        vm.upVolume = function () {
            audio.volume += 0.1;
        }

        vm.downVolume = function () {
            audio.volume -= 0.1;
        }

        vm.resume = function () {
            audio.play();
        }

        let segmentEnd = null;
        vm.playSegment = function (startTime, endTime) {
            $log.info('playSegment', startTime, endTime);

            segmentEnd = endTime;
            audio.currentTime = startTime;
            audio.play();

            audio.addEventListener('timeupdate', function () {
                if (segmentEnd && audio.currentTime >= segmentEnd) {
                    vm.pause();
                }
            }, false);
        }
    }

})


directives.directive('emotionalTimeLineImagesCarousel', function () {
    return {
        restricted: 'E',
        controller: emotionalTimeLineImagesCarouselController,
        templateUrl: 'emotionalTimeLineImagesCarousel.view.html',
        bindToController: true,
        controllerAs: 'vm',
        scope: {
            data: '=',
            options: '='
        }
    };

    function emotionalTimeLineImagesCarouselController($scope, $element, $log, timeToStrFilter, $interval, timeToDateFilter, scale0255To100Filter, scale0255Filter, roundFilter, capitalizeFilter, propPaisWiseArgmaxFilter) {
        let vm = this;
        let audio = document.getElementById('audioElement');
        $scope.$watch('vm.data', function () {
            $log.info('carousel watch', vm);

            // update chart
            if (_.size(vm.data) === 0) {
                return
            }

            // 4. put images into carousel #screenshotGallery
            d3.select("#screenshotGallery").selectAll('.bx-wrapper').remove();

            $log.info('vm.data', vm.data);

            var item = d3.select("#screenshotGallery")
                .append('div')
                .attr('class', 'slider-carousel')
                .selectAll('.slide')
                .data(vm.data);

            item.enter().append('div')
                .attr('class', 'slide')


            item.exit().remove();

            item.selectAll('.picture')
                .data(function (d) { return [d]; })
                .enter().append('img')
                .attr('src', function (d) { return './data/imageDir/' + d.screenshot.replace('-cropped', ''); });

            item.selectAll('.picture-info')
                .data(function (d) { return [d]; })
                .enter().append('span')
                .attr('class', 'item-text')
                .text(function (d) {
                    return capitalizeFilter(d.key) + ': ' + roundFilter(d.score * 100) + '%';
                })

            $(document).ready(function () {
                let slider = $('.slider-carousel').bxSlider({
                    //auto: true,
                    adaptiveHeight: true,
                    slideWidth: 170,
                    minSlides: 2,
                    maxSlides: 5,
                    slideMargin: 10,
                    //preloadImages: 'all',
                    touchEnabled: false
                });
                slider.reloadSlider();
            });

        }, true);
    }

})



// directives.directive('scatter', function () {
//     return {
//         restricted: 'E',
//         controller: scatterController
//     };

//     function scatterController($scope, $element) {
//         var margin = { top: 20, right: 20, bottom: 30, left: 40 },
//             width = 960 - margin.left - margin.right,
//             height = 500 - margin.top - margin.bottom;

//         /* 
//          * value accessor - returns the value to encode for a given data object.
//          * scale - maps value to a visual display encoding, such as a pixel position.
//          * map function - maps from data value to display value
//          * axis - sets up axis
//          */

//         // setup x 
//         var xValue = function (d) { return d.Calories; }, // data -> value
//             xScale = d3.scale.linear().range([0, width]), // value -> display
//             xMap = function (d) { return xScale(xValue(d)); }, // data -> display
//             xAxis = d3.svg.axis().scale(xScale).orient("bottom");

//         // setup y
//         var yValue = function (d) { return d["Protein (g)"]; }, // data -> value
//             yScale = d3.scale.linear().range([height, 0]), // value -> display
//             yMap = function (d) { return yScale(yValue(d)); }, // data -> display
//             yAxis = d3.svg.axis().scale(yScale).orient("left");

//         // setup fill color
//         var cValue = function (d) { return d.Manufacturer; },
//             color = d3.scale.category10();

//         // add the graph canvas to the body of the webpage
//         var svg = d3.select($element[0]).append("svg")
//             .attr("width", width + margin.left + margin.right)
//             .attr("height", height + margin.top + margin.bottom)
//             .append("g")
//             .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//         // add the tooltip area to the webpage
//         var tooltip = d3.select("body").append("div")
//             .attr("class", "tooltip")
//             .style("opacity", 0);

//         // load data
//         d3.csv("./data/data.csv", function (error, data) {

//             // change string (from CSV) into number format
//             data.forEach(function (d) {
//                 d.Calories = +d.Calories;
//                 d["Protein (g)"] = +d["Protein (g)"];
//                 //    console.log(d);
//             });

//             // don't want dots overlapping axis, so add in buffer to data domain
//             xScale.domain([d3.min(data, xValue) - 1, d3.max(data, xValue) + 1]);
//             yScale.domain([d3.min(data, yValue) - 1, d3.max(data, yValue) + 1]);

//             // x-axis
//             svg.append("g")
//                 .attr("class", "x axis")
//                 .attr("transform", "translate(0," + height + ")")
//                 .call(xAxis)
//                 .append("text")
//                 .attr("class", "label")
//                 .attr("x", width)
//                 .attr("y", -6)
//                 .style("text-anchor", "end")
//                 .text("Calories");

//             // y-axis
//             svg.append("g")
//                 .attr("class", "y axis")
//                 .call(yAxis)
//                 .append("text")
//                 .attr("class", "label")
//                 .attr("transform", "rotate(-90)")
//                 .attr("y", 6)
//                 .attr("dy", ".71em")
//                 .style("text-anchor", "end")
//                 .text("Protein (g)");

//             // draw dots
//             svg.selectAll(".dot")
//                 .data(data)
//                 .enter().append("circle")
//                 .attr("class", "dot")
//                 .attr("r", 3.5)
//                 .attr("cx", xMap)
//                 .attr("cy", yMap)
//                 .style("fill", function (d) { return color(cValue(d)); })
//                 .on("mouseover", function (d) {
//                     tooltip.transition()
//                         .duration(200)
//                         .style("opacity", .9);
//                     tooltip.html(d["Cereal Name"] + "<br/> (" + xValue(d)
//                         + ", " + yValue(d) + ")")
//                         .style("left", (d3.event.pageX + 5) + "px")
//                         .style("top", (d3.event.pageY - 28) + "px");
//                 })
//                 .on("mouseout", function (d) {
//                     tooltip.transition()
//                         .duration(500)
//                         .style("opacity", 0);
//                 });

//             // draw legend
//             var legend = svg.selectAll(".legend")
//                 .data(color.domain())
//                 .enter().append("g")
//                 .attr("class", "legend")
//                 .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

//             // draw legend colored rectangles
//             legend.append("rect")
//                 .attr("x", width - 18)
//                 .attr("width", 18)
//                 .attr("height", 18)
//                 .style("fill", color);

//             // draw legend text
//             legend.append("text")
//                 .attr("x", width - 24)
//                 .attr("y", 9)
//                 .attr("dy", ".35em")
//                 .style("text-anchor", "end")
//                 .text(function (d) { return d; })
//         });
//     }
// })