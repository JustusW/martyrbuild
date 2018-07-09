angular.module('MartyrSkillEditor', ['angular.filter'])
    .filter('unsafe', function($sce) {
        return function(val) {
            return $sce.trustAsHtml(val);
        };
    })
    .filter('urlencode', function() {
        return function(input) {
            return window.encodeURIComponent(input);
        }
    })
    .controller('SkillSelectorController', function($scope, $location) {
        var ssc = this;
        ssc.description = {
            x: 0,
            y: 0,
            show: false,
            title: '',
            description: ''
        };
        
        ssc.currentCount = 0;
        ssc.currentHash = '';
        ssc.fullLink = '';
        
        function getCategoryLang(cat) {
            var name = cat;
            var container = lang.data.getElementsByTagName(name)[0];
            
            if (!container) {
                return [null,null,null];
            }
            
            var containerDescription = container.getElementsByTagName('desc')[0];
            var containerName = container.getElementsByTagName('name')[0];
            var containerCategory = container.getElementsByTagName('category')[0];
            
            var engDescription,engName, engCategory;
            if (containerDescription)
                engDescription = containerDescription.getElementsByTagName("eng")[0].innerHTML;
            if (containerName)
                engName = containerName.getElementsByTagName("eng")[0].innerHTML;
            if (containerCategory)
                engCategory = containerCategory.getElementsByTagName("eng")[0].innerHTML;
            
            engDescription = engDescription.replace('[ff2bede6]', '<b class="text-danger">').replace('[/ff2bede6]', '</b>');
            
            return [engDescription, engName, engCategory];
        }
        
        function getSkillLang(skill, scale) {
            if (!scale) scale = 1;
            var name = skill.Skill;
            var skillData = data[name];
            var container = lang.data.getElementsByTagName(name)[0];
            var containerDescription = container.getElementsByTagName('Desc')[0];
            var containerName = container.getElementsByTagName('Name')[0];
            if (!containerDescription)
                containerDescription = container.getElementsByTagName('Desc_' + ssc.currentType.toLowerCase())[0];
            
            var engDescription = 'If you can read this, something is broken. ' + name, engName = '';
            if (containerDescription)
                engDescription = containerDescription.getElementsByTagName("eng")[0].innerHTML;
            if (containerName)
                engName = containerName.getElementsByTagName("eng")[0].innerHTML;
            
            var effect = skillData.Effect;
            var bonus_effect = skillData.BonusEffect;
            if (effect) {
                var search = new RegExp('{' + effect.property + '[^}]*}', 'g')
                var matches = engDescription.match(search);
                
                var value = effect.value * scale;
                if (-1 < value && value < 1) {
                    value = Math.round(value * 1000) / 10. + '%';
                }
                if (matches) {
                    engDescription = engDescription.replace(matches[0], value);
                }
            }
            if (bonus_effect) {
                var search = new RegExp('{' + bonus_effect.property + '[^}]*}', 'g')
                var matches = engDescription.match(search);
                
                var value = bonus_effect.value * scale;
                if (-1 < value && value < 1) {
                    value = Math.round(value * 1000) / 10. + '%';
                }
                if (matches) {
                    engDescription = engDescription.replace(matches[0], value);
                }
            }
            
            engDescription = engDescription.split('[ff2bede6]').join('<b class="text-danger">').split('[/ff2bede6]').join('</b>');
            
            return [engDescription, engName];
        }
        
        function getSkill(row, col) {
            var skills = ssc.currentSkills();
            for (name in skills) {
                var skill = skills[name];
                if (skill.col == col && skill[name].row == row) {
                    return skill;
                }
            }
        }
        
        ssc.getCategoryLang = getCategoryLang;
        ssc.getSkillLang = getSkillLang;
        
        ssc.resetSkills = function () {
            for (name in ssc.currentSkills()) {
                var s = ssc.currentSkills()[name];
                if (s.selected) s.selected = false;
            };
            ssc.updateLink();
        };
        
        ssc.resetAllSkills = function () {
            for (catName in ssc.currentCategory()) {
                for (name in ssc.getSkills(catName)) {
                    var s = ssc.getSkills(catName)[name];
                    if (s.selected) s.selected = false;
                };
            }
            ssc.updateLink();
        };
        
        ssc.categoryHasActiveSkills = function (name) {
            var cat = ssc.getSkills(name);
            for (s in cat) {
                if (cat[s].selected) {
                    return true;
                }
            }
        }
        
        ssc.categoryActiveSkills = function (name) {
            var skills = [];
            var cat = ssc.getSkills(name);
            for (s in cat) {
                if (cat[s].selected) {
                    skills.push(cat[s]);
                }
            }
            return skills;
        }
        
        ssc.categoryActiveSkillCount = function (name) {
            var count = 0;
            var cat = ssc.getSkills(name);
            for (s in cat) {
                if (cat[s].selected) {
                    count++;
                }
            }
            return count;
        }
        
        ssc.currentCategory = function () {
            return data[ssc.currentType];
        }
        
        ssc.currentSkills = function () {
            return ssc.getSkills(ssc.currentSkill);
        }
        
        ssc.getSkillsArray = function (tree) {
            var out = [];
            var obj = ssc.getSkills(tree);
            for (name in obj) {
                out.push(obj[name]);
            }
            return out;
        }
        
        ssc.getSkills = function (tree) {
            if (ssc.currentCategory())
                if (ssc.currentCategory()[tree])
                    return ssc.currentCategory()[tree].data;
        }
        
        ssc.connectorLineStyle = function (skill, req) {
            var x1 = skill.col * 80 + 40;
            var y1 = skill.row * 80 + 40;
            
            var refSkill = ssc.currentSkills()[req];
            var x2 = refSkill.col * 80 + 40;
            var y2 = refSkill.row * 80 + 40;
            
            var length = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
            var angle  = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            
            var transform = 'rotate('+angle+'deg)';

            var line = 'transform: ' + transform + ';';
            var line = line + 'width: ' + length + 'px;';
            var line = line + 'top: ' + y1 + 'px;';
            var line = line + 'left: ' + x1 + 'px;';

            return line;
        }
        
        ssc.setDescription = function (skill, e, cat) {
            if (!skill) {
                return ssc.description.show = false;
            }
            ssc.description.x = e.pageX;
            ssc.description.y = e.pageY;
            ssc.description.show = true;
            if (cat) {
                var lang = getCategoryLang(skill);
                ssc.description.description = lang[0];
                ssc.description.title = lang[1];
            } else {
                var lang = getSkillLang(skill);
                ssc.description.description = lang[0];
                ssc.description.title = lang[1];
            }
        };
        
        ssc.skillRequirementsMet = function (skill) {
            return !skill.Requirements || skill.Requirements.findIndex(function (s) {
                return s != '' && !ssc.currentSkills()[s].selected;
            }) == -1
        };
        
        ssc.updateLink = function () {
            var lnk = [ssc.currentType];
            for (catName in ssc.currentCategory()) {
                for (name in ssc.getSkills(catName)) {
                    var s = ssc.getSkills(catName)[name];
                    if (s.selected) lnk.push(catName + ',' + name);
                };
            }
            ssc.currentCount = lnk.length - 1;
            ssc.currentHash = lnk.join(';');
            $location.hash(ssc.currentHash);
            ssc.fullLink = window.location.href;
        };
        
        ssc.initiateFromLink = function () {
            var lnk = $location.hash();
            ssc.currentCount = 0;
            ssc.currentHash = lnk;
            if (lnk == 'parse') {
                return extractSkillTreeData();
            }
            ssc.currentType = lnk.split(';')[0];
            for (catName in ssc.currentCategory()) {
                for (name in ssc.getSkills(catName)) {
                    var s = ssc.getSkills(catName)[name];
                    s.selected = false;
                    if (lnk.indexOf(catName + ',' + name) > -1) {
                        s.selected = true;
                        ssc.currentCount++;
                    }
                };
            }
        };
        
        ssc.toggleSkill = function (skill) {
            if (!ssc.skillRequirementsMet(skill)) {
                skill.selected = false;
                ssc.updateLink();
                return;
            }
            if (skill.selected) {
                for (s in ssc.currentSkills()) {
                    var cs = ssc.currentSkills()[s];
                    if (cs.Requirements && cs.selected) {
                        if (cs.Requirements.findIndex(function (rs) {
                            var requiredSkill = ssc.currentSkills()[rs];
                            return cs.selected && skill.name == rs;
                        }) > -1) {
                            return;
                        }
                    }
                }
            } else if (ssc.currentCount > 55) {
                alert("Too many skills selected!");
                return;
            }
            skill.selected = !skill.selected;
            ssc.updateLink();
        };
       
        ssc.initiateFromLink();
        
        $scope.$watch('ssc.currentType', function () {
            ssc.currentSkill = '';
            ssc.updateLink();
        });
        $scope.$watch('ssc.currentCategory', function () {
            window.scrollTo(0,0);
            ssc.updateLink();
        });
        $scope.$watch('ssc.currentSkill', function () {
            window.scrollTo(0,0);
            ssc.updateLink();
        });
        
        $scope.$on('$locationChangeSuccess', function (e) {
            if($location.hash() != ssc.currentHash)
                ssc.initiateFromLink();
        });
        getSpellData();
    });


$.ajax({
    url: 'gamefiles/Lang_Skilltree.xml', 
    success: function (result) {
        lang.data = result;
    },
    async: false
});


function getSpellData() {
    $.get('gamefiles/data', null, function (data) {
        
    });
}
