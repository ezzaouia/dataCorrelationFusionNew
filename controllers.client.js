'use strict';

let controllers = angular.module('controllers.client', []);

// controller definition goes here
function MainCtrl($scope, $rootScope, $http, $mdToast, $log, $interval, scaleFilter, timeToStrFilter, FileSaver, Blob,
    valenceArousalAsAvgMaxPosMaxNegFilter, imageScoresWeightedMeanFilter, argmaxEmotionFilter,
    valenceArousalSegmentMeanFilter, valenceArousalSegmentDomEmotionWeightedMeanFilter,
    audioValenceArousalPosNegMapperFilter, emotionSumFilter, emotionSumGroupFilter, videoValenceArousalPosNegCombinerFilter,
    posNegNeuEmotionsFilter, keyPairWiseObjectArgmaxFilter, groupByPosNegNeuEmotionsFilter, groupByAllEmotionsFilter,
    emotionSumWithRoundFilter, capitalizeFilter, timeToDateFilter, strToNumberFilter, tNthresholdFilter, tPthresholdFilter, roundFilter, keyPairWiseTopNFilter, meanFilter, inverseScaleFilter) {

    let vm = this;

    this.audioEmotions = null;
    this.videoEmotions = null;
    this.selfReportedEmotions = null;
    this.spSessions = null;
    this.startEndSwitcher = 'START';
    this.mappedTracesInteractionsBySession = [];

    let thresholdValues = [10, 20, 30, 40, 50];

    function filterValenceArousalVectorsByThreshold(thresholdValues, audioVector, videoVector) {

        _.each(thresholdValues, function (threshold) {
            // 1. filter audioVector by threshold
            let filteredAudioVec = _.filter(audioVector, function (audioItem) {
                return inverseScaleFilter(audioItem.arousal) >= threshold;
            });

            // 2. get filteredAudioVec indices 'x'
            let filteredAudioVecIndices = _.pluck(filteredAudioVec, 'x');

            // 3. filter video keep only the filtered indices
            let filteredVideoVec = _.filter(videoVector, function (videoItem) {
                return _.indexOf(filteredAudioVecIndices, videoItem.x) !== -1 ? true : false;
            });

            // 4. save files
            // saveAsFile(_.map(filteredVideoVec, function (item) {
            //     return item.valence;
            // }), 'filteredVideoValence-' + threshold + '-');

            // saveAsFile(_.map(filteredAudioVec, function (item) {
            //     return item.valence;
            // }), 'filteredAudioValence-' + threshold + '-');
          
        });
    }

    vm.tNthreshold = [];
    this.audioVideoLineChartData = {
        dataset0AsVideoAvg: [],
        dataset1AsVideoWMAl: [],
        dataset2AsVideoDomWM: [],
        dataset3AsAudio: [],
        dataset4AsVideoEmotionsHisto: [],
        dataset5VideoTimeSeries: [],
        dataset6VideoTimeSeriesAllEmotions: [],
        dataset7VideoTimeSeriesTNthreshold: [],
        dataset8VideoTimeSeriesTPthreshold: [],
        dataset10VideoTimeSeriesTPTNthreshold: [],
        dataset9VideoTimeSeriesAllEmotionsInterestingPoints: []
    };

    // init function 
    let loadJsonData = function () {
        // progress
        vm.activated = true;
        // load self reported json data
        async.waterfall([
            function (callback) {
                $http.get('./data/emoselfreporteds.json').then(function (res) {
                    callback(null, res.data.selfReported);
                    vm.selfReportedEmotions = _.sortBy(res.data.selfReported, 'created.$date');
                }, function (error) {
                    callback(error);
                });
            },
            // fill session filter after loading json data
            function (data, callback) {
                let sp_sessions = _.sortBy(data, 'created.$date');
                sp_sessions = _.map(sp_sessions, _.partialRight(_.pick, 'sp_session'));
                sp_sessions = _.uniq(_.pluck(sp_sessions, 'sp_session.$oid'));
                callback(null, data, sp_sessions);
            }
        ], function (err, data, sessions) {
            if (err) {
                console.log(err);
                return;
            }
            // put sp spSessions & selfReportedEmotions in the scope
            vm.spSessions = sessions;
            vm.selfReportedEmotions = _.sortBy(data, 'created.$date');
        });

        // start loading audios json data
        async.waterfall([
            function (callback) {
                $http.get('./data/emoaudios.json').then(function (res) {
                    vm.audioEmotions = res.data;
                    callback(null, vm.audioEmotions);
                }, function (err) {
                    callback(err);
                });
            }
        ], function (err, data) {
            if (err) {
                console.log(err);
                return;
            }
            // put audio emotions data in mainCtrl scope
            vm.audioEmotions = data;
        });

        // start loading videos json data
        async.waterfall([
            function (callback) {
                $http.get('./data/emovideos.json').then(function (res) {
                    vm.videoEmotions = res.data;
                    callback(null, vm.videoEmotions);
                }, function (err) {
                    callback(err);
                });
            }
        ], function (err, data) {
            if (err) {
                console.log(err);
                return;
            }
            // put video emotions data in mainCtrl scope
            this.videoEmotions = data;
        });

        // start loading session's interactions json data
        async.waterfall([
            function (callback) {
                $http.get('./data/emosessioninteractions.json').then(function (res) {
                    vm.sessionsInteractions = res.data;
                    callback(null, res.data);
                }, function (err) {
                    callback(err);
                });
            }
        ], function (err, data) {
            if (err) {
                console.log(err);
                return;
            }

            this.sessionsInteractions = data;
            //$log.debug(' this.sessionsInteractions == ',  this.sessionsInteractions);
        });

        // start loading session's chunks json data
        async.waterfall([
            function (callback) {
                $http.get('./data/chunks.json').then(function (res) {
                    vm.sessionsChunks = res.data;
                    callback(null, res.data);
                }, function (err) {
                    callback(err);
                });
            }
        ], function (err, data) {
            if (err) {
                console.log(err);
                return;
            }
            this.sessionsChunks = data;
            //$log.debug(' this.sessionsChunks == ',  this.sessionsChunks);
            // progress
            vm.activated = false;
        });
    };

    // call init
    loadJsonData();

    // apply filter
    this.applyFilter = function () {

        vm.activated = true;

        vm.audioVideoLineChartData = {
            dataset0AsVideoAvg: [],
            dataset1AsVideoWMAl: [],
            dataset2AsVideoDomWM: [],
            dataset3AsAudio: []
        };
        // check if a session is selected 
        if (!vm.selectedSpSessions) {
            vm.showSimpleToast('Please select a session!');
            return;
        }

        /** get selfReported emotions from loaded data */
        getSelfReportedEmotionsBySessionFromJsonData(vm.selfReportedEmotions, vm.selectedSpSessions);
        /** audio scatter plot */
        getAudioEmotionsByTimeSegment();
        /** video scatter plot */
        getVideoEmotionsByTimeSegment();

        /** get session's interactions */
        getSessionInteractions(vm.sessionsInteractions, vm.sessionsChunks, vm.selectedSpSessions);

        vm.activated = false;

        $log.debug('audioVideoLineChartData', vm.audioVideoLineChartData);
    };

    function getSessionInteractions(sessionsInteractions, sessionsChunks, selectedSpSessions) {
        vm.tracesInteractionsBySession = _.where(sessionsInteractions, { sp_session: selectedSpSessions })
        let chunksBySession = _.where(sessionsChunks, { sp_session: selectedSpSessions })

        // if chunks size === 1 so there is only one chunk so all 
        // the events belong to this chunk
        // otherwise find the chunk of the event
        vm.mappedTracesInteractionsBySession = [];
        _.forEach(vm.tracesInteractionsBySession, function (itemI, index) {
            _.forEach(chunksBySession, function (itemC) {
                if (moment(itemI.created).isBetween(itemC.startAbsolute, itemC.stopAbsolute)) {

                    // if the event if free_text add it to our events bag
                    // as event_type: TEXT with associated seek (position) and duration: 0
                    if (itemI.action_name === 'FREE_TEXT') {
                        vm.mappedTracesInteractionsBySession.push(
                            {
                                event_type: itemI.action_content_type,
                                seek: itemC.startRelative + +new Date(itemI.created) - +new Date(itemC.startAbsolute),
                                duration: 0
                            });
                    }
                    // if the event is sharing doc we need to add it to our events bag
                    // as event_type: PDF | IMAGE ..
                    // seek: related to SHOW_DOC event (next event of the current one)
                    // duration: TODO !!!! skip it for now
                    // VERSION 0
                    /*
                    if (itemI.action_name === 'SHARING_DOC') {
                        if (vm.tracesInteractionsBySession[index + 1].action_name === 'SHOW_DOC') {
                            vm.mappedTracesInteractionsBySession.push(
                            {
                                event_type: itemI.action_content_type,
                                seek: itemC.startRelative + +new Date(vm.tracesInteractionsBySession[index + 1].created) - +new Date(itemC.startAbsolute),
                                duration: 0
                            }); 
                        } else {
                            $log.error('Error traces interactions !!');
                        }
                    }
                    */
                    // VERSION 1 improved one
                    // if action_name is SHOW_DOC so
                    // Go_backward until action_name == SHARING_DOC to get document type
                    // Go_forward until action_name == HIDE_DOC to get duration
                    if (itemI.action_name === 'SHOW_DOC') {
                        let event_type = null;
                        let duration = null;
                        let i = 0;
                        do {
                            i++;
                            event_type = vm.tracesInteractionsBySession[index - i].action_content_type;
                        } while ((vm.tracesInteractionsBySession[index - i].action_name !== 'SHARING_DOC'))

                        i = 0;
                        do {
                            i++;
                            duration = +new Date(vm.tracesInteractionsBySession[index + i].created) - +new Date(itemI.created);
                        } while ((vm.tracesInteractionsBySession[index + i].action_name !== 'HIDE_DOC'))

                        vm.mappedTracesInteractionsBySession.push(
                            {
                                event_type: event_type,
                                seek: itemC.startRelative + +new Date(itemI.created) - +new Date(itemC.startAbsolute),
                                duration: duration
                            });
                    }

                    //itemI.seek = itemC.startRelative + +new Date(itemI.created) - +new Date(itemC.startAbsolute);
                }
            });
        });
    }

    function getSelfReportedEmotionsBySessionFromJsonData(jsonData, selectedSpSessions) {

        if (typeof selectedSpSessions === 'string') {
            selectedSpSessions = [selectedSpSessions];
        }

        let groupedEmotions = [];
        _.forEach(selectedSpSessions, function (spSessionId) {
            let filtered = _.where(jsonData, {
                'sp_session': {
                    '$oid': spSessionId
                },
                'check_point': vm.startEndSwitcher
            });
            filtered = _.map(filtered, _.partialRight(_.pick, 'sp_session', 'emotions', 'check_point', 'created'));
            groupedEmotions = groupedEmotions.concat(filtered);
        });

        let filter = _.map(groupedEmotions, _.partialRight(_.pick, 'emotions'));

        let emotions = _.pluck(filter, 'emotions');

        let mood = _.map(emotions, function (emotion) {
            return [emotion.valence_level, emotion.arousal_level];
        });

        let discreteEmotions = _.pluck(emotions, 'discrete_emotions');

        discreteEmotions = _.reduceRight(discreteEmotions, function (flattened, other) {
            return flattened.concat(other);
        }, []);

        discreteEmotions = _.chain(discreteEmotions).groupBy('emotion_name').value();

        discreteEmotions = _.mapValues(discreteEmotions, function (tab) {
            return _.pluck(tab, 'emotion_level');
        });

        _.map(vm.discrete_emotions, function (item) {
            item.emotion_level = [];
            return item;
        });

        _.forEach(discreteEmotions, function (emotionLevelValues, emotionName) {
            let objectToChange = _.find(vm.selfReportedDiscreteEmotions, { emotion_name: emotionName });
            let index = _.indexOf(vm.selfReportedDiscreteEmotions, objectToChange);
            vm.selfReportedDiscreteEmotions.splice(index, 1, {
                emotion_name: emotionName,
                emotion_display_name: objectToChange.emotion_display_name,
                emotion_icon: objectToChange.emotion_icon,
                emotion_level: emotionLevelValues
            });
        });
        vm.selfReportedDiscreteEmotions = _.cloneDeep(vm.selfReportedDiscreteEmotions);
        vm.selfReportedMoodMapEmotions = mood;
        getSelfReportedProjectedDiscreteEmotions();
    }

    // get projection of discrete emotions
    // -----------------------------------
    this.selfReportedProjectedDiscreteEmotions = [];
    let getSelfReportedProjectedDiscreteEmotions = function () {
        vm.selfReportedProjectedDiscreteEmotions = [];
        let filter = _.filter(vm.selfReportedDiscreteEmotions, function (item) {
            return _.size(item.emotion_level) > 0;
        });
        if (_.size(filter)) {
            _.forEach(filter, function (item) {
                let matchedValenceArousal = _.where(valenceArousalMappingTable, { 'emotion_name': item.emotion_name });
                vm.selfReportedProjectedDiscreteEmotions.push([_.first(_.pluck(matchedValenceArousal, 'valence')) / 100.00, _.first(_.pluck(matchedValenceArousal, 'arousal')) / 100.00, item.emotion_name, item.emotion_level])
            });

            vm.selfReportedProjectedDiscreteEmotions.push(_getWeightedMeanPoint(vm.selfReportedProjectedDiscreteEmotions));
        } else {
            vm.showSimpleToast('Nothing to map!');
        }
    };

    // get audio valence arousal
    // -------------------------
    this.audioEmotionsByTimeSegmentForMoodMap = [];
    vm.jTotableAudioEmotions = [];
    vm.selectedAudioEmotions = [];
    let getAudioEmotionsByTimeSegment = function () {
        vm.audioEmotionsByTimeSegmentForMoodMap = [];
        vm.selectedAudioEmotions = _.where(vm.audioEmotions, { 'sp_session': { '$oid': vm.selectedSpSessions } });
        vm.selectedAudioEmotions = _.first(vm.selectedAudioEmotions);
        if (vm.selectedAudioEmotions) {
            vm.bShowTtable = true;
            vm.jTotableAudioEmotions = _.get(vm.selectedAudioEmotions, 'audio_emotion_scores');

            _.forEach(vm.jTotableAudioEmotions.result.analysisSegments, function (sig) {
                var from = sig.offset;
                from = new Date(from);
                from = timeToStrFilter(from);

                var to = new Date(Number(sig.duration) + sig.offset);
                to = timeToStrFilter(to);

                vm.audioEmotionsByTimeSegmentForMoodMap.push([scaleFilter(sig.analysis.Valence.Value) / 100.00, scaleFilter(sig.analysis.Arousal.Value) / 100.00, '', from, to]);
            });
        }
    };

    // get video valence arousal
    // -------------------------
    this.videoEmotionsByAudioTimeSegmentForMoodMapAsAvgPosNegFormula = [];
    this.videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorWMForEachEmotionFormula = [];
    this.videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorDomEmotionForEachImageFormula = [];
    this.selectedVideoEmotions = [];
    let getVideoEmotionsByTimeSegment = function () {
        vm.selectedVideoEmotions = _.where(vm.videoEmotions, { 'sp_session': { '$oid': vm.selectedSpSessions } });
        vm.selectedVideoEmotions = _.first(vm.selectedVideoEmotions);

        // get screenshot by time segment
        // for here we can flatten theme to plot the scatter 
        // and reuse theme for line chart later
        let screenshotsByAudioTimeSegment = _getScreenshotsByAudioTimeSegment(vm.selectedAudioEmotions, 4, vm.selectedVideoEmotions, _.get(vm.selectedVideoEmotions, 'sp_session.$oid'));
        vm.screenshotsByAudioTimeSegment = screenshotsByAudioTimeSegment;
        // video valence & arousal as Avg formula
        let videoEmotionsByAudioTimeSegmentForMoodMapAsAvgPosNegFormula = mapScreenshotsScoresToValenceArousalAsAvgPosNegFormula(screenshotsByAudioTimeSegment);
        vm.videoEmotionsByAudioTimeSegmentForMoodMapAsAvgPosNegFormula = _.map(_.flatten(videoEmotionsByAudioTimeSegmentForMoodMapAsAvgPosNegFormula), function (bag) {
            return _.values(bag);
        });

        // video valence & arousal as Vec. Coor. weighed mean for all scores of each screenshot
        let videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorWMForEachEmotionFormula = mapScreenshotsScoresToValenceArousalAsVecCoorWMForEachEmotionFormula(screenshotsByAudioTimeSegment);
        vm.videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorWMForEachEmotionFormula = _.map(_.flatten(videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorWMForEachEmotionFormula), function (bag) {
            return _.values(bag);
        });

        // video valence & arousal as Vec. Coor. for the dominate emotion
        let videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorDomEmotionForEachImageFormula = mapScreenshotsScoresToValenceArousalAsVecCoorDomEmotionForEachImageFormula(screenshotsByAudioTimeSegment);
        vm.videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorDomEmotionForEachImageFormula = _.map(_.flatten(videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorDomEmotionForEachImageFormula), function (bag) {
            return _.values(_.pick(bag, ['valence', 'arousal', 'screenshot']));
        });

        // video valence & arousal as Avg formula Mean by segment Mean
        let videoEmotionsByAudioTimeSegmentForMoodMapAsAvgPosNegFormulaMean = _.map(videoEmotionsByAudioTimeSegmentForMoodMapAsAvgPosNegFormula, valenceArousalSegmentMeanFilter);
        vm.videoEmotionsByAudioTimeSegmentForMoodMapAsAvgPosNegFormulaMean = _.map(_.flatten(videoEmotionsByAudioTimeSegmentForMoodMapAsAvgPosNegFormulaMean), function (bag) {
            return _.values(bag);
        });

        // video valence & arousal as Vec. Coor. weighed mean for all scores of each screenshot Mean
        let videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorWMForEachEmotionFormulaMean = _.map(videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorWMForEachEmotionFormula, valenceArousalSegmentMeanFilter);
        vm.videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorWMForEachEmotionFormulaMean = _.map(_.flatten(videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorWMForEachEmotionFormulaMean), function (bag) {
            return _.values(bag);
        });

        // video valence & arousal as Vec. Coor. for the dominate emotion Mean by segment
        let videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorDomEmotionForEachImageFormulaMean = _.map(videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorDomEmotionForEachImageFormula, valenceArousalSegmentDomEmotionWeightedMeanFilter);
        vm.videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorDomEmotionForEachImageFormulaMean = _.map(_.flatten(videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorDomEmotionForEachImageFormulaMean), function (bag) {
            return _.values(bag);
        });

        // get audio video pos/neg
        // audio
        let audioValenceArousalPosNeg = _.map(vm.jTotableAudioEmotions.result.analysisSegments, audioValenceArousalPosNegMapperFilter);
        // video
        let videoValenceArousalPosNeg = _.map(screenshotsByAudioTimeSegment, videoValenceArousalPosNegCombinerFilter);
        //videoValenceArousalPosNeg = _.map(videoValenceArousalPosNeg, emotionSumGroupFilter);

        vm.valenceConfusionMatrix = compteConfusionMatrix(_.pluck(audioValenceArousalPosNeg, 'valence'), _.pluck(videoValenceArousalPosNeg, 'valence'));
        vm.arousalConfusionMatrix = compteConfusionMatrix(_.pluck(audioValenceArousalPosNeg, 'arousal'), _.pluck(videoValenceArousalPosNeg, 'arousal'));

        // get proportion of each emotions in the video
        let videoAllImagesScores = emotionSumFilter(vm.selectedVideoEmotions.video_emotion_scores);
        let videoAllImagesScoresByAudioSeg = _.map(screenshotsByAudioTimeSegment, emotionSumFilter);
        videoAllImagesScores = _.mapValues(videoAllImagesScores, function (val) {
            return val * 100;
        });
        videoAllImagesScores = _.mapKeys(videoAllImagesScores, function (value, key) {
            return key.toLowerCase();
        });

        // time series line chart
        // 1. map each emotion's score inside parent array, bag images array to Pos Neu Neg emotions
        let screenshotsByAudioTimeSegmentMappedPosNegNeu = _.map(screenshotsByAudioTimeSegment, function (bag) {
            return _.map(bag, function (item) {
                return posNegNeuEmotionsFilter(item.scores);
            });
        });

        // 2. map each emotion's score inside parent array, bag images array to argmax from pos neg neu
        let screenshotsByAudioTimeSegmentMappedPosNegNeuArgmax = _.map(screenshotsByAudioTimeSegmentMappedPosNegNeu, function (bag) {
            return _.map(bag, function (item) {
                return keyPairWiseObjectArgmaxFilter(item);
            });
        });

        // 3. frenquency of each emotion pos neg neu
        let screenshotsByAudioTimeSegmentMappedPosNegNeuArgmaxGroupByEmotion = groupByPosNegNeuEmotionsFilter(screenshotsByAudioTimeSegmentMappedPosNegNeuArgmax);
        screenshotsByAudioTimeSegmentMappedPosNegNeuArgmaxGroupByEmotion = _.map(screenshotsByAudioTimeSegmentMappedPosNegNeuArgmaxGroupByEmotion, function (item, index) {
            return _.extend({ x: index }, item);
        })

        // here same as the mapping done with pos neg and neu but with all emotions
        // 2. map each emotion's score inside parent array, bag images array to argmax from pos neg neu
        let screenshotsByAudioTimeSegmentMeanForEachEmotion = _.map(screenshotsByAudioTimeSegment, emotionSumWithRoundFilter);

        // 2.1 get top 3 emotions
        let screenshotsByAudioTimeSegmentMeanForEachEmotionTop3 = _.map(screenshotsByAudioTimeSegmentMeanForEachEmotion, function (item) {
            return keyPairWiseTopNFilter(item, 3);
        });

        // 3. frenquency of each emotion pos neg neu
        screenshotsByAudioTimeSegmentMeanForEachEmotion = _.map(screenshotsByAudioTimeSegmentMeanForEachEmotion, function (item, index) {
            return _.extend({ x: index }, item);
        });

        // 4. 
        screenshotsByAudioTimeSegmentMeanForEachEmotionTop3 = _.map(screenshotsByAudioTimeSegmentMeanForEachEmotionTop3, function (item, index) {
            return _.extend({ x: index }, item);
        });

        //$log.info('screenshotsByAudioTimeSegmentMappedPosNegNeu', screenshotsByAudioTimeSegmentMeanForEachEmotion);
        let tNthreshold = _.filter(screenshotsByAudioTimeSegmentMappedPosNegNeuArgmaxGroupByEmotion, function (item) {
            return tNthresholdFilter(item, meanFilter(_.pluck(screenshotsByAudioTimeSegmentMappedPosNegNeuArgmaxGroupByEmotion, 'negative')));
        });

        $log.debug('screenshotsByAudioTimeSegmentMappedPosNegNeuArgmaxGroupByEmotion', screenshotsByAudioTimeSegmentMappedPosNegNeuArgmaxGroupByEmotion);
        $log.debug('mean ==== ', meanFilter(_.pluck(screenshotsByAudioTimeSegmentMappedPosNegNeuArgmaxGroupByEmotion, 'negative')));


        let tPthreshold = _.filter(screenshotsByAudioTimeSegmentMappedPosNegNeuArgmaxGroupByEmotion, function (item) {
            return tPthresholdFilter(item);
        });

        let interestingPoints = tNthreshold.concat(tPthreshold);
        vm.interestingPointsIndices = _.pluck(interestingPoints, 'x');
        let screenshotsByAudioTimeSegmentMeanForEachEmotionInterestingPoints = _.filter(screenshotsByAudioTimeSegmentMeanForEachEmotion, function (item) {
            return _.indexOf(vm.interestingPointsIndices, item.x) !== -1 ? true : false;
        });

        $log.info('interestingPointsIndices', vm.interestingPointsIndices);


        // I'll use the objects already computed to plot line chart
        vm.audioVideoLineChartData = {
            dataset0AsVideoAvg: _.map(videoEmotionsByAudioTimeSegmentForMoodMapAsAvgPosNegFormulaMean, videoLineChartDataMapper),
            dataset1AsVideoWMAl: _.map(videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorWMForEachEmotionFormulaMean, videoLineChartDataMapper),
            dataset2AsVideoDomWM: _.map(videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorDomEmotionForEachImageFormulaMean, videoLineChartDataMapper),
            dataset3AsAudio: _.map(vm.audioEmotionsByTimeSegmentForMoodMap, audioLineChartDataMapper),
            dataset4AsVideoEmotionsHisto: [{ x: 0 }, _.extend({ x: 1 }, videoAllImagesScores), { x: 2 }],
            dataset5VideoTimeSeries: screenshotsByAudioTimeSegmentMappedPosNegNeuArgmaxGroupByEmotion,
            dataset6VideoTimeSeriesAllEmotions: screenshotsByAudioTimeSegmentMeanForEachEmotion,
            dataset7VideoTimeSeriesTNthreshold: tNthreshold,
            dataset8VideoTimeSeriesTPthreshold: tPthreshold,
            dataset10VideoTimeSeriesTPTNthreshold: tPthreshold.concat(tNthreshold),
            dataset9VideoTimeSeriesAllEmotionsInterestingPoints: screenshotsByAudioTimeSegmentMeanForEachEmotionInterestingPoints,
            dataset11VideoTimeSeriesTop3Emotions: screenshotsByAudioTimeSegmentMeanForEachEmotionTop3
        };



        filterValenceArousalVectorsByThreshold(thresholdValues, vm.audioVideoLineChartData.dataset3AsAudio, vm.audioVideoLineChartData.dataset1AsVideoWMAl);

        //$log.info('vm.audioVideoLineChartData', videoAllImagesScoresByAudioSeg)

        // save valence arousal
        // audio
        // let audioValence = _.map(vm.audioEmotionsByTimeSegmentForMoodMap, function (array) {
        //     return array[0];
        // });
        // let audioArousal = _.map(vm.audioEmotionsByTimeSegmentForMoodMap, function (array) {
        //     return array[1];
        // });
        // // saving
        // saveAsFile(audioValence, 'audioValence-');
        // saveAsFile(audioArousal, 'audioArousal-');

        // // video Avg
        // let videoValenceAvg = _.map(vm.videoEmotionsByAudioTimeSegmentForMoodMapAsAvgPosNegFormulaMean, function (array) {
        //     return array[0];
        // });
        // let videoArousalAvg = _.map(vm.videoEmotionsByAudioTimeSegmentForMoodMapAsAvgPosNegFormulaMean, function (array) {
        //     return array[1];
        // });
        // saveAsFile(videoValenceAvg, 'videoValenceAvg-');
        // saveAsFile(videoArousalAvg, 'videoArousalAvg-');

        // // video W.M. Al.
        // let videoValenceWMAl = _.map(vm.videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorWMForEachEmotionFormulaMean, function (array) {
        //     return array[0];
        // });
        // let videoArousalWMAl = _.map(vm.videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorWMForEachEmotionFormulaMean, function (array) {
        //     return array[1];
        // });
        // saveAsFile(videoValenceWMAl, 'videoValenceWMAl-');
        // saveAsFile(videoArousalWMAl, 'videoArousalWMAl-');

        // // video Dom.
        // let videoValenceDom = _.map(vm.videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorDomEmotionForEachImageFormulaMean, function (array) {
        //     return array[0];
        // });
        // let videoArousalDom = _.map(vm.videoEmotionsByAudioTimeSegmentForMoodMapAsVecCoorDomEmotionForEachImageFormulaMean, function (array) {
        //     return array[1];
        // });
        // saveAsFile(videoValenceDom, 'videoValenceDom-');
        // saveAsFile(videoArousalDom, 'videoArousalDom-');

    };


    function compteConfusionMatrix(audioBinaryArray, videoBinaryArray) {
        let confusionMatrix = { 'TP': 0, 'TN': 0, 'FP': 0, 'FN': 0, 'N': _.size(audioBinaryArray) };
        _.forEach(audioBinaryArray, function (val, index) {
            if (val === 1 && val === videoBinaryArray[index]) { confusionMatrix.TP++; }
            if (val === 0 && val === videoBinaryArray[index]) { confusionMatrix.TN++; }
            if (val === 1 && val !== videoBinaryArray[index]) { confusionMatrix.FP++; }
            if (val === 0 && val !== videoBinaryArray[index]) { confusionMatrix.FN++; }
        });
        return confusionMatrix;
    }

    function videoLineChartDataMapper(object, index) {
        return { x: index, valence: _.get(object, 'valence') * 100, arousal: _.get(object, 'arousal') * 100 };
    }

    function audioLineChartDataMapper(array, index) {
        return { x: index, valence: array[0] * 100, arousal: array[1] * 100 };
    }


    this.videoEmotionsHistoChartOptions = {
        margin: { top: 5 },
        series: [
            {
                axis: "y",
                dataset: "dataset4AsVideoEmotionsHisto",
                key: "fear",
                label: "Fear",
                color: "#9C27B0",
                type: ['column'],
                id: 'mySeriesFear'
            },
            {
                axis: "y",
                dataset: "dataset4AsVideoEmotionsHisto",
                key: "anger",
                label: "Anger",
                color: "#E91E63",
                type: ['column'],
                id: 'mySerieAnger'
            },
            {
                axis: "y",
                dataset: "dataset4AsVideoEmotionsHisto",
                key: "sadness",
                label: "Sadness",
                color: "#000000",
                type: ['column'],
                id: 'mySeriesSadness'
            },
            {
                axis: "y",
                dataset: "dataset4AsVideoEmotionsHisto",
                key: "happiness",
                label: "Happiness",
                color: "#4CAF50",
                type: ['column'],
                id: 'mySeriesHappiness'
            },
            {
                axis: "y",
                dataset: "dataset4AsVideoEmotionsHisto",
                key: "neutral",
                label: "Neutral",
                color: "#2196F3",
                type: ['column'],
                id: 'mySeriesNeutral'
            },
            {
                axis: "y",
                dataset: "dataset4AsVideoEmotionsHisto",
                key: "contempt",
                label: "Contempt",
                color: "#009688",
                type: ['column'],
                id: 'mySeriesContempt'
            },
            {
                axis: "y",
                dataset: "dataset4AsVideoEmotionsHisto",
                key: "disgust",
                label: "Disgust",
                color: "#5C5C5C",
                type: ['column'],
                id: 'mySeriesDisgust'
            },
            {
                axis: "y",
                dataset: "dataset4AsVideoEmotionsHisto",
                key: "surprise",
                label: "Surprise",
                color: "#FF9800",
                type: ['column'],
                id: 'mySeriesDisgust'
            }
        ],
        axes: {
            x: {
                key: "x",
                ticks: [0, 1, 2]
            },
            y: {
                max: 102
            }
        }
    };




    this.videoTimeSeriesLineChartTop3EmotionsOptions = {
        margin: { top: 5 },
        series: [
            {
                axis: "y",
                dataset: "dataset11VideoTimeSeriesTop3Emotions",
                key: "fear",
                label: "Fear",
                color: "#9C27B0",
                type: ['line', 'dot'],
                id: 'mySeriesFear'
            },
            {
                axis: "y",
                dataset: "dataset11VideoTimeSeriesTop3Emotions",
                key: "anger",
                label: "Anger",
                color: "#E91E63",
                type: ['line', 'dot'],
                id: 'mySerieAnger'
            },
            {
                axis: "y",
                dataset: "dataset11VideoTimeSeriesTop3Emotions",
                key: "sadness",
                label: "Sadness",
                color: "#000000",
                type: ['line', 'dot'],
                id: 'mySeriesSadness'
            },
            {
                axis: "y",
                dataset: "dataset11VideoTimeSeriesTop3Emotions",
                key: "happiness",
                label: "Happiness",
                color: "#4CAF50",
                type: ['line', 'dot'],
                id: 'mySeriesHappiness'
            },
            {
                axis: "y",
                dataset: "dataset11VideoTimeSeriesTop3Emotions",
                key: "neutral",
                label: "Neutral",
                color: "#2196F3",
                type: ['line', 'dot'],
                id: 'mySeriesNeutral'
            },
            {
                axis: "y",
                dataset: "dataset11VideoTimeSeriesTop3Emotions",
                key: "contempt",
                label: "Contempt",
                color: "#009688",
                type: ['line', 'dot'],
                id: 'mySeriesContempt'
            },
            {
                axis: "y",
                dataset: "dataset11VideoTimeSeriesTop3Emotions",
                key: "disgust",
                label: "Disgust",
                color: "#5C5C5C",
                type: ['line', 'dot'],
                id: 'mySeriesDisgust'
            },
            {
                axis: "y",
                dataset: "dataset11VideoTimeSeriesTop3Emotions",
                key: "surprise",
                label: "Surprise",
                color: "#FF9800",
                type: ['line', 'dot'],
                id: 'mySeriesDisgust'
            }
        ],
        axes: {
            x: {
                key: 'x',
                tickFormat: function (value, index) {
                    return value + '/' + timeToStrFilter(timeToDateFilter(vm.jTotableAudioEmotions.result.analysisSegments[value].offset)) + '-' +
                        timeToStrFilter(timeToDateFilter(strToNumberFilter(vm.jTotableAudioEmotions.result.analysisSegments[value].duration) + vm.jTotableAudioEmotions.result.analysisSegments[value].offset));
                }
            },
            y: {
                max: 102
            }
        }
    };


    this.videoTimeSeriesLineChartAllEmotionsOptions = {
        margin: { top: 5 },
        series: [
            {
                axis: "y",
                dataset: "dataset6VideoTimeSeriesAllEmotions",
                key: "fear",
                label: "Fear",
                color: "#9C27B0",
                type: ['column'],
                id: 'mySeriesFear'
            },
            {
                axis: "y",
                dataset: "dataset6VideoTimeSeriesAllEmotions",
                key: "anger",
                label: "Anger",
                color: "#E91E63",
                type: ['column'],
                id: 'mySerieAnger'
            },
            {
                axis: "y",
                dataset: "dataset6VideoTimeSeriesAllEmotions",
                key: "sadness",
                label: "Sadness",
                color: "#000000",
                type: ['column'],
                id: 'mySeriesSadness'
            },
            {
                axis: "y",
                dataset: "dataset6VideoTimeSeriesAllEmotions",
                key: "happiness",
                label: "Happiness",
                color: "#4CAF50",
                type: ['column'],
                id: 'mySeriesHappiness'
            },
            {
                axis: "y",
                dataset: "dataset6VideoTimeSeriesAllEmotions",
                key: "neutral",
                label: "Neutral",
                color: "#2196F3",
                type: ['column'],
                id: 'mySeriesNeutral'
            },
            {
                axis: "y",
                dataset: "dataset6VideoTimeSeriesAllEmotions",
                key: "contempt",
                label: "Contempt",
                color: "#009688",
                type: ['column'],
                id: 'mySeriesContempt'
            },
            {
                axis: "y",
                dataset: "dataset6VideoTimeSeriesAllEmotions",
                key: "disgust",
                label: "Disgust",
                color: "#5C5C5C",
                type: ['column'],
                id: 'mySeriesDisgust'
            },
            {
                axis: "y",
                dataset: "dataset6VideoTimeSeriesAllEmotions",
                key: "surprise",
                label: "Surprise",
                color: "#FF9800",
                type: ['column'],
                id: 'mySeriesDisgust'
            }
        ],
        axes: {
            x: {
                key: 'x',
                tickFormat: function (value, index) {
                    return value + '/' + timeToStrFilter(timeToDateFilter(vm.jTotableAudioEmotions.result.analysisSegments[value].offset)) + '-' +
                        timeToStrFilter(timeToDateFilter(strToNumberFilter(vm.jTotableAudioEmotions.result.analysisSegments[value].duration) + vm.jTotableAudioEmotions.result.analysisSegments[value].offset));
                }
            },
            y: {
                max: 102
            }
        }
    };

    this.videoTimeSeriesLineChartAllEmotionsInterestingPointsOptions = {
        margin: { top: 5 },
        series: [
            {
                axis: "y",
                dataset: "dataset9VideoTimeSeriesAllEmotionsInterestingPoints",
                key: "fear",
                label: "Fear",
                color: "#9C27B0",
                type: ['column'],
                id: 'mySeriesFear'
            },
            {
                axis: "y",
                dataset: "dataset9VideoTimeSeriesAllEmotionsInterestingPoints",
                key: "anger",
                label: "Anger",
                color: "#E91E63",
                type: ['column'],
                id: 'mySerieAnger'
            },
            {
                axis: "y",
                dataset: "dataset9VideoTimeSeriesAllEmotionsInterestingPoints",
                key: "sadness",
                label: "Sadness",
                color: "#000000",
                type: ['column'],
                id: 'mySeriesSadness'
            },
            {
                axis: "y",
                dataset: "dataset9VideoTimeSeriesAllEmotionsInterestingPoints",
                key: "happiness",
                label: "Happiness",
                color: "#4CAF50",
                type: ['column'],
                id: 'mySeriesHappiness'
            },
            {
                axis: "y",
                dataset: "dataset9VideoTimeSeriesAllEmotionsInterestingPoints",
                key: "neutral",
                label: "Neutral",
                color: "#2196F3",
                type: ['column'],
                id: 'mySeriesNeutral'
            },
            {
                axis: "y",
                dataset: "dataset9VideoTimeSeriesAllEmotionsInterestingPoints",
                key: "contempt",
                label: "Contempt",
                color: "#009688",
                type: ['column'],
                id: 'mySeriesContempt'
            },
            {
                axis: "y",
                dataset: "dataset9VideoTimeSeriesAllEmotionsInterestingPoints",
                key: "disgust",
                label: "Disgust",
                color: "#5C5C5C",
                type: ['column'],
                id: 'mySeriesDisgust'
            },
            {
                axis: "y",
                dataset: "dataset9VideoTimeSeriesAllEmotionsInterestingPoints",
                key: "surprise",
                label: "Surprise",
                color: "#FF9800",
                type: ['column'],
                id: 'mySeriesDisgust'
            }
        ],
        axes: {
            x: {
                key: 'x',
                padding: { min: 3, max: 6 },
                tickFormat: function (value, index) {
                    return value + '/' + timeToStrFilter(timeToDateFilter(vm.jTotableAudioEmotions.result.analysisSegments[value].offset)) + '-' +
                        timeToStrFilter(timeToDateFilter(strToNumberFilter(vm.jTotableAudioEmotions.result.analysisSegments[value].duration) + vm.jTotableAudioEmotions.result.analysisSegments[value].offset));
                }
            },
            y: {
                max: 102
            }
        }
    };

    this.videoTimeSeriesLineChart3EmotionsOptions = {
        series: [
            {
                axis: "y",
                dataset: "dataset5VideoTimeSeries",
                key: "neutral",
                label: "Neutral",
                color: "#2196F3",
                type: ['line'],
                id: 'mySeries0'
            },
            {
                axis: "y",
                dataset: "dataset5VideoTimeSeries",
                key: "positive",
                label: "Positive",
                color: "#558B2F",
                type: ['line'],
                id: 'mySeries1'
            },
            {
                axis: "y",
                dataset: "dataset5VideoTimeSeries",
                key: "negative",
                label: "Negative",
                color: "#C62828",
                type: ['line'],
                id: 'mySeries2'
            },
            {
                axis: "y",
                dataset: "dataset7VideoTimeSeriesTNthreshold",
                key: "negative",
                label: "TNegative",
                color: "#C62828",
                type: ['dot'],
                id: 'mySeries3'
            },
            {
                axis: "y",
                dataset: "dataset8VideoTimeSeriesTPthreshold",
                key: "positive",
                label: "TPositive",
                color: "#558B2F",
                type: ['dot'],
                id: 'mySeries4'
            }

        ],
        axes: {
            x: { key: "x" },
            y: { max: 110 }
        },
        symbols: []
    };

    this.audioVideoLineChartOptions = {
        series: [
            {
                axis: "y",
                dataset: "dataset3AsAudio",
                key: "valence",
                label: "Audio Valence",
                color: "#827717",
                type: ['line', 'dot'],
                id: 'mySeries0'
            },
            {
                axis: "y",
                dataset: "dataset3AsAudio",
                key: "arousal",
                label: "Audio Arousal",
                color: "#2962FF",
                type: ['line', 'dot'],
                id: 'mySeries1'
            },
            {
                axis: "y",
                dataset: "dataset0AsVideoAvg",
                key: "valence",
                label: "Video Val. Avg.",
                color: "#EF6C00",
                type: ['line', 'dot'],
                id: 'mySeries2'
            },
            {
                axis: "y",
                dataset: "dataset0AsVideoAvg",
                key: "arousal",
                label: "Video Aro. Avg.",
                color: "#6200EA",
                type: ['line', 'dot'],
                id: 'mySeries3'
            },
            {
                axis: "y",
                dataset: "dataset1AsVideoWMAl",
                key: "valence",
                label: "Video Val. WMAl.",
                color: "#1B5E20",
                type: ['line', 'dot'],
                id: 'mySeries4'
            },
            {
                axis: "y",
                dataset: "dataset1AsVideoWMAl",
                key: "arousal",
                label: "Video Aro. WMAl.",
                color: "#607D8B",
                type: ['line', 'dot'],
                id: 'mySeries5'
            },
            {
                axis: "y",
                dataset: "dataset2AsVideoDomWM",
                key: "valence",
                label: "Video Val. DomWM.",
                color: "#795548",
                type: ['line', 'dot'],
                id: 'mySeries6'
            },
            {
                axis: "y",
                dataset: "dataset2AsVideoDomWM",
                key: "arousal",
                label: "Video Aro. DomWM.",
                color: "#DD2C00",
                type: ['line', 'dot'],
                id: 'mySeries7'
            }
        ],
        axes: { x: { key: "x" } }
    };

    function mapScreenshotsScoresToValenceArousalAsVecCoorWMForEachEmotionFormula(screenshotsByAudioTimeSegment) {
        let screenshotsScoresToValenceArousalAsVecCoorWMForEachEmotionFormula = [];
        _.forEach(screenshotsByAudioTimeSegment, function (imagesBag) {
            let _imagesBag = [];
            _.forEach(imagesBag, function (image) {
                _imagesBag.push(_.extend({}, imageScoresWeightedMeanFilter(image.scores), { image: image.screenshot }));
            });

            screenshotsScoresToValenceArousalAsVecCoorWMForEachEmotionFormula.push(_imagesBag);
        });

        return screenshotsScoresToValenceArousalAsVecCoorWMForEachEmotionFormula;
    }

    function mapScreenshotsScoresToValenceArousalAsVecCoorDomEmotionForEachImageFormula(screenshotsByAudioTimeSegment) {
        let screenshotsScoresToValenceArousalAsVecCoorDomEmotionForEachImageFormula = [];
        _.forEach(screenshotsByAudioTimeSegment, function (imagesBag) {
            let _imagesBag = [];
            _.forEach(imagesBag, function (image) {
                _imagesBag.push(_.extend({}, argmaxEmotionFilter(image.scores), { image: image.screenshot }));
            });

            screenshotsScoresToValenceArousalAsVecCoorDomEmotionForEachImageFormula.push(_imagesBag);
        });

        return screenshotsScoresToValenceArousalAsVecCoorDomEmotionForEachImageFormula;
    }

    function mapScreenshotsScoresToValenceArousalAsAvgPosNegFormula(screenshotsByAudioTimeSegment) {
        let screenshotsScoresToValenceArousalAsAvgPosNegFormula = [];
        _.forEach(screenshotsByAudioTimeSegment, function (imagesBag) {
            let _imagesBag = [];
            _.forEach(imagesBag, function (image) {

                _imagesBag.push(_.extend({}, {
                    valence: scaleFilter(_.get(valenceArousalAsAvgMaxPosMaxNegFilter(image.scores), 'valence') * 100) / 100,
                    arousal: scaleFilter(_.get(valenceArousalAsAvgMaxPosMaxNegFilter(image.scores), 'arousal') * 100) / 100,
                }, { image: image.screenshot }));
            });

            screenshotsScoresToValenceArousalAsAvgPosNegFormula.push(_imagesBag);
        });

        return screenshotsScoresToValenceArousalAsAvgPosNegFormula;
    }

    function _getScreenshotsByAudioTimeSegment(audioEmotions, interval, videoEmotions, spSession) {
        videoEmotions = _.get(videoEmotions, 'video_emotion_scores');
        audioEmotions = _.get(audioEmotions, 'audio_emotion_scores');
        console.log('spSession', spSession)
        let screenshotBySegs = {};
        _.forEach(videoEmotions, function (vItem) {

            // compute screenshot time position
            // get screenshot number
            let screenshotTimePosition = null;
            let screenshotNbr = Number(vItem['screenshot'].slice(10).replace('-cropped.jpg', ''));
            if (spSession == '575ef103f1a57a61252b4feb') {
                screenshotTimePosition = ((screenshotNbr * (1 / 4)) - (1 / 4)) * 1000;
            } else {
                screenshotTimePosition = ((screenshotNbr * interval) - interval) * 1000;
            }

            _.forEach(audioEmotions.result.analysisSegments, function (oItem, index) {
                let oSegsTimeEnd = _.last(audioEmotions.result.analysisSegments).offset + _.last(audioEmotions.result.analysisSegments).duration;
                let oSegsTimeStart = _.first(audioEmotions.result.analysisSegments).offset;
                let oSegTimeEnd = oItem.offset + oItem.duration;
                let oSegTimeStart = oItem.offset;

                if (screenshotTimePosition <= oSegsTimeStart) {
                    (screenshotBySegs[0] = (screenshotBySegs[0] || [])).push(vItem);
                    return false;
                }
                if (screenshotTimePosition >= oSegsTimeEnd) {
                    (screenshotBySegs[_.size(audioEmotions.result.analysisSegments) - 1] = (screenshotBySegs[_.size(audioEmotions.result.analysisSegments) - 1] || [])).push(vItem);
                    return false;
                } else if (screenshotTimePosition >= oSegTimeStart && screenshotTimePosition <= oSegTimeEnd) {
                    (screenshotBySegs[index] = (screenshotBySegs[index] || [])).push(vItem);
                    return false;
                }
            });
        });
        return screenshotBySegs;
    }



    /**
     * Map projected points discrete emotions
     * @param projectedPoints
     * @private
     */
    function _getWeightedMeanPoint(projectedPoints) {
        // get positive points with weights
        let weightsPoisitivesPoints = { points: [], weights: [] };
        _.forEach(projectedPoints, function (item) {
            //if (item[ 0 ] > 0 && item[ 1 ] > 0) {
            weightsPoisitivesPoints['points'].push([item[0], item[1]]);
            weightsPoisitivesPoints['weights'].push(item[3]);
            ///}
        });
        // normalize weights
        let W = _.map(weightsPoisitivesPoints['weights'], function (w) {
            return w / _.sum(weightsPoisitivesPoints['weights']);
        });

        // compute mean weight
        var xMean = 0, yMean = 0;
        weightsPoisitivesPoints['weights'][0] = 100;

        _.forEach(weightsPoisitivesPoints['points'], function (xy, index) {
            xMean += W[index] * xy[0];
            yMean += W[index] * xy[1];
        });

        return [xMean, yMean, 'Weighted Mean'];
    }

    function _propPaisWiseArgmax(object) {
        let vals = _.values(object);
        let keys = _.keys(object);
        let max = _.max(vals);
        return [keys[_.indexOf(vals, max)].toUpperCase(), max];
    }

    // lostr logic
    let last = {
        bottom: false,
        top: true,
        left: false,
        right: true
    };

    this.toastPosition = angular.extend({}, last);

    this.getToastPosition = function () {
        sanitizePosition();
        return Object.keys(vm.toastPosition).filter(function (pos) {
            return vm.toastPosition[pos];
        }).join(' ');
    };

    function sanitizePosition() {
        let current = vm.toastPosition;
        if (current.bottom && last.top) current.top = false;
        if (current.top && last.bottom) current.bottom = false;
        if (current.right && last.left) current.left = false;
        if (current.left && last.right) current.right = false;
        last = angular.extend({}, current);
    }

    this.showSimpleToast = function (message) {
        let pinTo = vm.getToastPosition();
        $mdToast.show(
            $mdToast.simple().textContent(message).position(pinTo).hideDelay(3000)
        );
    };


    this.selfReportedDiscreteEmotions = [{
        emotion_name: 'SURPRISE',
        emotion_display_name: 'surprise',
        emotion_icon: 'sentiment_very_satisfied',
        emotion_level: []
    }, {
            emotion_name: 'HAPPINESS',
            emotion_display_name: 'happiness',
            emotion_icon: 'mood',
            emotion_level: []
        }, {
            emotion_name: 'NEUTRAL',
            emotion_display_name: 'neutral',
            emotion_icon: 'sentiment_neutral',
            emotion_level: []
        }, {
            emotion_name: 'SADNESS',
            emotion_display_name: 'sadness',
            emotion_icon: 'mood_bad',
            emotion_level: []
        }, {
            emotion_name: 'ANGER',
            emotion_display_name: 'anger',
            emotion_icon: 'sentiment_dissatisfied',
            emotion_level: []
        },
        {
            emotion_name: 'FEAR',
            emotion_display_name: 'fear',
            emotion_icon: 'sentiment_very_dissatisfied',
            emotion_level: []
        }];

    // Living Well on the Spectrum: How to Use Your Strengths to Meet the ...
    // Par Valerie L. Gaus, page 91 Joy === Happy
    let valenceArousalMappingTable = [
        { 'emotion_name': 'ANGER', 'valence': -37, 'arousal': 47, dim: 'np' },
        { 'emotion_name': 'FEAR', 'valence': -61, 'arousal': 7, dim: 'np' },
        { 'emotion_name': 'HAPPINESS', 'valence': 68, 'arousal': 7, dim: 'pp' },
        { 'emotion_name': 'SADNESS', 'valence': -68, 'arousal': -35, dim: 'nn' },
        { 'emotion_name': 'NEUTRAL', 'valence': 0, 'arousal': 0, dim: 'pp' },
        { 'emotion_name': 'SURPRISE', 'valence': 30, 'arousal': 8, dim: 'pp' },
        { 'emotion_name': 'CONTEMPT', 'valence': -55, 'arousal': 43, dim: 'np' },
        { 'emotion_name': 'DISGUST', 'valence': -68, 'arousal': 20, dim: 'np' }
    ];

    this.mood = {
        xValue: 0,
        yValue: 0,
        bMoodMapClicked: false
    };

    function saveAsFile(arrayData, nameOfFile) {
        let data = new Blob([arrayData.join(',')], { type: 'text/plain;charset=utf-8' });
        FileSaver.saveAs(data, nameOfFile + vm.selectedSpSessions + '.txt');
    }


    let margin = { top: 40, right: 40, bottom: 40, left: 40 },
        width = Math.min(180, window.innerWidth - 10) - margin.left - margin.right - 10,
        height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);


    this.radarChartOptions = {
        w: width,
        h: height,
        margin: margin,
        levels: 3,				//How many levels or inner circles should be drawn
        maxValue: 0, 			//What is the value that the biggest circle will represent
        labelFactor: 1.25, 	//How much farther than the radius of the outer circle should the labels be placed
        wrapWidth: 60, 		//The number of pixels after which a label needs to be given a new line
        opacityArea: 0.35, 	//The opacity of the area of the blob
        dotRadius: 2, 			//The size of the colored circles of each blog
        opacityCircles: 0.1, 	//The opacity of the circles of each blob
        strokeWidth: 1, 		//The width of the stroke around each blob
        roundStrokes: true,	//If true the area and stroke will follow a round path (cardinal-closed)
        //color: d3.scale.category10(),	//Color function
        class: '.radarChart'
    };


    this.pieChartData = [];
    this.options = [{ key: 'positive', color: 'green' }, { key: 'negative', color: 'red' }];
    this.data = [
        {
            key: 'positive',
            "offset": '110272',
            "duration": '60000',
            "label": "ok",
            "value": "16"
        }, {
            key: 'negative',
            "offset": '1200000',
            "duration": '120000',
            "label": "ok",
            "value": "30"
        }, {
            key: 'positive',
            "offset": '217272',
            "duration": '90000',
            "label": "ok",
            "value": "100"
        }
    ];

    vm.dataPlayer = {};
    vm.screenshotsBag = [];
    this.onClickEmotionalTimeLineChart = function (data) {
        vm.dataPlayer = data;
        $scope.$digest();
    }

    this.onMouseenterEmotionalTimeLineChart = function (data, screenshotsBag) {
        vm.screenshotsBag = screenshotsBag;
        let mouseCorrespondingData = _.find(vm.audioVideoLineChartData.dataset6VideoTimeSeriesAllEmotions, { x: data.x });
        buildPieChartData(mouseCorrespondingData)
        buildRadarChartData(mouseCorrespondingData);
        builtBarChartDiscreteEmotionsData(mouseCorrespondingData);
        builtBarChartValenceArousalData(data, vm.audioVideoLineChartData.dataset3AsAudio, vm.audioVideoLineChartData.dataset0AsVideoAvg);
        $scope.$digest();

        $log.info('vm.audioVideoLineChartData', vm.audioVideoLineChartData);

    }

    function buildRadarChartData(data) {
        vm.radarChartData = _.map(_.omit(data, 'x'), function (val, key) {
            return { axis: capitalizeFilter(key), value: roundFilter(val / 100) }
        })
    }

    function totalReducer(total, n) {
        return total + n;
    }

    function builtBarChartValenceArousalData(indexData, audioData, videoData) {
        let audioSeg = audioData[indexData.x];
        let videoSeg = videoData[indexData.x];
        let size = _.size(audioData);
        $log.info('video =', videoData);

        vm.barChartValenceArousalData = [
            { arousalAudio: videoSeg.arousal, valenceAudio: videoSeg.valence, arousalVideo: audioSeg.arousal, valenceVideo: audioSeg.valence },
            { arousalAudio: _.reduce(_.pluck(videoData, 'arousal'), totalReducer) / size, valenceAudio: _.reduce(_.pluck(videoData, 'valence'), totalReducer) / size, arousalVideo: _.reduce(_.pluck(audioData, 'arousal'), totalReducer) / size, valenceVideo: _.reduce(_.pluck(audioData, 'valence'), totalReducer) / size }
        ]
        $log.info('barChartValenceArousalData', vm.barChartValenceArousalData);

    }

    function builtBarChartDiscreteEmotionsData(data) {
        vm.barChartData = [_.omit(data, 'x'), _.omit(_.find(vm.audioVideoLineChartData.dataset4AsVideoEmotionsHisto, { x: 1 }), 'x')];
    }

    function buildPieChartData(data) {
        let neutral = _.pick(data, ['neutral']);
        let positive = _.pick(data, ['happiness', 'surprise']);
        let negative = _.pick(data, ['sadness', 'disgust', 'contempt', 'fear', 'anger']);
        positive = _.sum(_.values(positive));
        negative = _.sum(_.values(negative));
        vm.pieChartData = [
            { label: "Neutral", value: roundFilter(_.get(neutral, 'neutral')), color: "#2196F3" },
            { label: "Positive", value: roundFilter(positive), color: "#558B2F" },
            { label: "Negative", value: roundFilter(negative), color: "#C62828" }
        ];
    }

    this.barChartDiscreteEmotionsOptions = {
        bars: [
            {
                axis: "y",
                key: "fear",
                label: "Fear",
                color: "#9C27B0",
            },
            {
                axis: "y",
                key: "anger",
                label: "Anger",
                color: "#E91E63",
            },
            {
                axis: "y",
                key: "sadness",
                label: "Sadness",
                color: "#000000",
            },
            {
                axis: "y",
                key: "happiness",
                label: "Happiness",
                color: "#4CAF50",
            },
            {
                axis: "y",
                key: "neutral",
                label: "Neutral",
                color: "#2196F3",
            },
            {
                axis: "y",
                key: "contempt",
                label: "Contempt",
                color: "#009688",
            },
            {
                axis: "y",
                key: "disgust",
                label: "Disgust",
                color: "#5C5C5C",
            },
            {
                axis: "y",
                key: "surprise",
                label: "Surprise",
                color: "#FF9800",
            }
        ],
        ticks: ['Video Seg.', 'Video Ses.']
    };

    this.barChartValenceArousalEmotionsOptions = {
        bars: [
            {
                axis: "y",
                key: "valenceAudio",
                label: "A. Valence",
                color: "#9C27B0",
            },
            {
                axis: "y",
                key: "arousalAudio",
                label: "A. Arousal",
                color: "#009688",
            },
            {
                axis: "y",
                key: "valenceVideo",
                label: "V. Valence",
                color: "#5C5C5C",
            },
            {
                axis: "y",
                key: "arousalVideo",
                label: "V. Arousal",
                color: "#FF9800",
            }
        ],
        ticks: ['V./A. Seg.', 'V./A. Ses.']
    };
}


controllers.controller('MainCtrl', MainCtrl);