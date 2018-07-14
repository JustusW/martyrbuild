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
        
        ssc.perks = [{}, {}, {}];
        ssc.currentCount = 0;
        ssc.currentHash = '';
        ssc.fullLink = '';
        
        var langCache = {};

        function union_arrays (x, y) {
            var obj = {};
            for (var i = x.length-1; i >= 0; -- i)
                obj[x[i]] = x[i];
            for (var i = y.length-1; i >= 0; -- i)
                obj[y[i]] = y[i];
            var res = []
            for (var k in obj) {
                if (obj.hasOwnProperty(k))  // <-- optional
                    res.push(obj[k]);
            }
            return res;
        }

        function replaceEffect(input, name, value, scale) {
            if (!scale) scale = 1;
            var search = new RegExp('{' + name + '[^}]*}', 'g')
            var matches = input.match(search);
            
            if (isNaN(value)) {
                if (matches) {
                    input = input.replace(matches[0], value);
                }
            } else {
            
                value = value * scale;
                if (-1 < value && value < 1) {
                    value = Math.round(value * 1000) / 10. + '%';
                }
                if (matches) {
                    input = input.replace(matches[0], value);
                }
            }
            return input;
        }

        function getLangContainer(search) {
            for (name in lang) {
                var result = lang[name].getElementsByTagName(search);
                if (result.length == 1) {
                    return result[0];
                }
            }
            for (name in lang) {
                var result = $(lang[name]).find('*').filter(function(index,elm) {
                    return elm.nodeName.toLowerCase() == search.toLowerCase();
                });
                if (result.length == 1) {
                    return result[0];
                }
                if (result.length >= 1) {
                    for (r in result) {
                        if (result[r].children.length > 0)
                            return result[r];
                    };
                }
            }
        }

        function decorateLang(string) {
            return string.split('[ff2bede6]').join('<b class="text-danger">').split('[/ff2bede6]').join('</b>').split('\\n').join('\n');
        }

        function getLang(search) {
            search = search.toLowerCase();
            if (langCache[search]) return langCache[search];
            
            container = getLangContainer(search);
            var result = {name: search};
            if (!container) {
                langCache[search] = result;
                return result;
            }
            
            for (child in container.children) {
                c = container.children[child];
                if (c.nodeType != 1) continue;
                
                if (c.nodeName == 'eng') {
                    value = c.innerHTML;
                    result['name'] = decorateLang(value);
                } else {
                    var name = c.nodeName.toLowerCase();
                    if (name.startsWith('desc')) name = 'desc';
                    value = c.children[0].innerHTML;
                    result[name] = decorateLang(value);
                }
            }
            langCache[search] = result;
            return result;
        }


        function getSpellLang(spell, lng) {
            
            var name = spell;
            var langData = getLang(name);
            
            if (langData.name == name.toLowerCase()) {
                return [name, null];
            }
            
            var engDescription,engName;
            if (langData.desc)
                engDescription = langData.desc;
            if (langData.name)
                engName = langData.name;
            
            engDescription = decorateLang(engDescription);
            
            return [engName, engDescription];
        }
        
        function getCategoryLang(cat) {
            var name = cat;
            var langData = getLang(name);
            
            if (langData.name == name.toLowerCase()) {
                return [null,null,null];
            }
            
            var engDescription,engName, engCategory;
            if (langData.desc)
                engDescription = langData.desc;
            if (langData.name)
                engName = langData.name;
            if (langData.category)
                engCategory = langData.category;
            
            engDescription = decorateLang(engDescription);
            
            return [engDescription, engName, engCategory];
        }
        
        function getSkillLang(skill, scale) {
            var name = skill.Skill;
            
            var langData = getLang(name);
            
            var engDescription = 'If you can read this, something is broken. ' + name, engName = '';
            
            if (langData.desc)
                engDescription = langData.desc;
            if (langData.name && langData.name != name.toLowerCase())
                engName = langData.name;
            
            var skillData = data[name];
            var effect = skillData.Effect;
            var bonus_effect = skillData.BonusEffect;
            
            if (effect) {
                engDescription = replaceEffect(engDescription, effect.property, effect.value, scale);
            }
            if (bonus_effect) {
                engDescription = replaceEffect(engDescription, bonus_effect.property, bonus_effect.value, scale);
            }
            
            engDescription = decorateLang(engDescription);
            
            return [engDescription, engName];
        }
        
        function getEnchantLang(enchant) {
            var name = enchant.NameID[0];
            
            var langData = getLang(name);
            
            var engDescription = 'If you can read this, something is broken. ' + name, engName = '';
            
            if (langData.desc)
                engDescription = langData.desc;
            if (langData.name && langData.name != name.toLowerCase())
                engName = langData.name;
            
            if (enchant.Property) {
                var value = enchant.Values.slice(-1)[0].replace('(','').replace(')','').split(';')[1];
                engDescription = replaceEffect(engDescription, enchant.Property[0], value);
                if (['ability_offensive', 'ability_survival', 'ability_special'].indexOf(enchant.Property[0]) > -1) {
                    engDescription = replaceEffect(engDescription, 'ability', enchant.Property[0]);
                }
            }
            
            engDescription = decorateLang(engDescription);
            
            return {desc: engDescription, name: engName};
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
        ssc.getEnchantLang = getEnchantLang;
        ssc.getLang = getLang;
        
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
        
        ssc.setRawDescription = function (e, name, lng) {
            ssc.description.x = e.pageX;
            ssc.description.y = e.pageY;
            ssc.description.show = true;
            
            var lang = getSpellLang(name, lng);
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
            ssc.perks.forEach(function (perk) {
                if (perk.name) lnk.push(perk.name);
                else lnk.push('');
            });
            ssc.currentHash = lnk.join(';');
            
            var spells = [];
            
            ssc.spells.forEach(function (spell) {
                if (!spell.triac) {spell.triac = [{},{},{}];}
                spells.push([spell.name, spell.triac[0].name, spell.triac[1].name, spell.triac[2].name].join(':'));
            });
            
            var hash = ssc.currentHash + '|||' + JSON.stringify(spells);
            $location.hash(hash);
            ssc.fullLink = $location.$$absUrl;
        };
        
        ssc.initiateFromLink = function () {
            var lnk = $location.hash();
            ssc.currentCount = 0;
            ssc.currentHash = lnk;
            if (lnk == 'parse') {
                return extractSkillTreeData();
            }
            lnk = lnk.split('|||');
            lnkArr = lnk[0].split(';');
            
            ssc.currentType = lnk[0].split(';')[0];
            for (catName in ssc.currentCategory()) {
                for (name in ssc.getSkills(catName)) {
                    var s = ssc.getSkills(catName)[name];
                    s.selected = false;
                    if (lnkArr.indexOf(catName + ',' + name) > -1) {
                        s.selected = true;
                        ssc.currentCount++;
                    }
                };
            }
            lnkArr.slice(-3).forEach(function (perk, index) {
                for (p in ssc.perkData) {
                    if (ssc.perkData[p].indexOf(perk) > -1) {
                        ssc.perks[index].name = perk;
                        return;
                    }
                }
            });
            
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
        
        ssc.selectPerk = function (perk, slot) {
            slot.selecting = false;
            slot.name = perk;
            
            ssc.updateLink();
            ssc.setDescription();
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
        
        ssc.spellClasses = ['Biomancy', 'Pyromancy', 'Divination', 'Telekinesis'];
        ssc.spells = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
        ssc.enchantData = enchantments.data;
        ssc.artifactTypes = [];
        ssc.enchantData.forEach(function (enchant) {
            ssc.artifactTypes = union_arrays(ssc.artifactTypes, enchant.ArtifactTypes);
        });
        ssc.spellData = spells.data;
        ssc.perkData = perks.data;
        
        ssc.initiateFromLink();
        ssc.ready2Roll = true;
        
        $scope.$watch('ssc.spells', function () {
            ssc.updateLink();
        });
        var initial = true;
        $scope.$watch('ssc.currentType', function () {
            ssc.currentSkill = '';
            if (!initial) {
                ssc.perks.forEach(function (perk) {
                    perk.name = '';
                });
            }
            ssc.updateLink();
            initial = false;
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

$.ajax({
    url: 'gamefiles/Lang_Perks.xml', 
    success: function (result) {
        lang.perks = result;
    },
    async: false
});

$.ajax({
    url: 'gamefiles/Lang_Artifacts.xml', 
    success: function (result) {
        lang.artifacts = result;
    },
    async: false
});

$.ajax({
    url: 'gamefiles/perks.json', 
    success: function (result) {
        perks.data = result;
    },
    async: false
});

$.ajax({
    url: 'gamefiles/spells.json', 
    success: function (result) {
        spells.data = result;
    },
    async: false
});

$.ajax({
    url: 'gamefiles/enchantments.json', 
    success: function (result) {
        enchantments.data = result;
    },
    async: false
});
