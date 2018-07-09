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
        
        function getSpellLang(spell) {
            var container = lang.skills.getElementsByTagName(spell)[0];
            if (!container) {
                return [spell, null];
            }
            var containerDescription = container.getElementsByTagName('Desc')[0];
            var containerName = container.getElementsByTagName('Name')[0];
            
            var engDescription,engName;
            if (containerDescription)
                engDescription = containerDescription.getElementsByTagName("eng")[0].innerHTML;
            if (containerName)
                engName = containerName.getElementsByTagName("eng")[0].innerHTML;
            
            return [engName, engDescription];
        }
        
        
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
        ssc.getSpellLang = getSpellLang;
        
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
        
        ssc.setRawDescription = function (e, name) {
            ssc.description.x = e.pageX;
            ssc.description.y = e.pageY;
            ssc.description.show = true;
            
            var lang = getSpellLang(name);
            ssc.description.title = lang[0];
            ssc.description.description = lang[1];
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
            
            var spells = [];
            
            ssc.spells.forEach(function (spell) {
                if (!spell.triac) {spell.triac = [{},{},{}];}
                spells.push([spell.name, spell.triac[0].name, spell.triac[1].name, spell.triac[2].name].join(':'));
            });
            
            $location.hash(ssc.currentHash + '|||' + JSON.stringify(spells));
            ssc.fullLink = window.location.href;
        };
        
        ssc.initiateFromLink = function () {
            var lnk = $location.hash();
            ssc.currentCount = 0;
            ssc.currentHash = lnk;
            if (lnk == 'parse') {
                return extractSkillTreeData();
            }
            lnk = lnk.split('|||');
            
            ssc.currentType = lnk[0].split(';')[0];
            for (catName in ssc.currentCategory()) {
                for (name in ssc.getSkills(catName)) {
                    var s = ssc.getSkills(catName)[name];
                    s.selected = false;
                    if (lnk[0].indexOf(catName + ',' + name) > -1) {
                        s.selected = true;
                        ssc.currentCount++;
                    }
                };
            }
            
            if (ssc.currentType == 'Psyker' && lnk[1]) {
                var spells = JSON.parse(lnk[1]);
                spells.forEach(function (entry, i) {
                    var spell = ssc.spells[i];
                    entry = entry.split(':');
                    spell.name = entry[0];
                    spell.triac = [{name: entry[1]},{name: entry[2]},{name: entry[3]}];
                });
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
        
        ssc.selectSpell = function (spell, slot) {
            slot.selecting = false;
            slot.name = spell.name;
            slot.triac = [{}, {}, {}];
            
            ssc.updateLink();
            ssc.setDescription();
        };
        
        ssc.selectRune = function (rune, slot) {
            slot.selecting = false;
            slot.name = rune;
            
            ssc.updateLink();
            ssc.setDescription();
        };
        
        $scope.$watch('ssc.spells', function () {
            ssc.updateLink();
        });
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
        
        ssc.spellClasses = ['Biomancy', 'Pyromancy', 'Divination', 'Telekinesis'];
        ssc.spells = [{}, {}, {}, {}, {}];
        ssc.spellData = spells.data;
       
        ssc.initiateFromLink();
        ssc.ready2Roll = true;
    });


$.ajax({
    url: 'gamefiles/Lang_Skilltree.xml', 
    success: function (result) {
        lang.data = result;
    },
    async: false
});

$.ajax({
    url: 'gamefiles/Lang_Skills.xml', 
    success: function (result) {
        lang.skills = result;
    },
    async: false
});


function getSpellData() {
    $.ajax({
        url: 'gamefiles/spells.json', 
        success: function (result) {
            spells.data = result;
        },
        async: false
    });
}


getSpellData();
