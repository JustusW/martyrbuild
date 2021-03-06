import os
import sys
from pprint import pprint
import json


def parse_enchants():
    file_path = 'gamefiles/artifacts.n2pk'
    with open(file_path, 'rb') as f:
        active = False
        enchantments = []
        for line in f.readlines():
            line = line.strip()
            if line == 'Enchantment':
                active = True
                enchantment = {}
                enchantments.append(enchantment)
            if line == '}':
                active = False
            if not active or line == '' or line.startswith('#'):
                continue
                
            if '=' in line:
                name, value = line.split('=', 1)
                enchantment[name] = value.split(',')
        
        with open('gamefiles/enchantments.json', 'w') as f:
            f.write(json.dumps(
                enchantments, sort_keys=True, indent=4, separators=(',', ': ')
            ))


def parse_perks():
    file_path = 'gamefiles/data'
    with open(file_path, 'rb') as f:
        active = False
        perks = {}
        for line in f.readlines():
            line = line.strip()
            if line == 'Perks':
                active = True
            if line == '}':
                active = False
            if not active or line == '' or line.startswith('#'):
                continue
            if '=' in line:
                name, value = line.split('=', 1)
                perks[name] = value.split(',')
        
        with open('gamefiles/perks.json', 'w') as f:
            f.write(json.dumps(
                perks, sort_keys=True, indent=4, separators=(',', ': ')
            ))


def parse_single_config(data):
    out = {
        'action': []
    }
    for line in data:
        if '=' not in line:
            continue
        try:
            target, value = line.strip().split('=', 1)
        except ValueError as e:
            print line
            raise(e)
        
        if target.startswith('action['):
            try:
                action_index = int(target[7:8])
            except ValueError:
                action_index = 0
            try:
                action = out['action'][action_index]
            except IndexError:
                action = {}
                out['action'].append(action)
            
            action[target[10:]] = value.split(',')
        else:
            out[target] = value.split(',')

    return out


def walker(walk_dir = 'gamefiles/psyker/'):
    spells = {}

    for root, subdirs, files in os.walk(walk_dir):

        for filename in files:
            file_path = os.path.join(root, filename)

            with open(file_path, 'rb') as f:
                f_content = f.readlines()
                try:
                    spells[filename] = parse_single_config(f_content)
                except OSError as e:
                    print f_content
                    raise(e)
    
    with open('gamefiles/psyker.json', 'w') as f:
        f.write(json.dumps(
            spells#, sort_keys=True, indent=4, separators=(',', ': ')
        ))


def extract_multi_file(target_file='gamefiles/Config/psykerspells.cfg'):
    spells = {}
    with open(target_file, 'rb') as f:
        current_target = ''
        for line in f.readlines():
            line = line.strip()
            if line.startswith('#'):
                continue
            if line.startswith('}'):
                current_target = ''
                continue
            if line.startswith('{'):
                continue
            if current_target == '':
                current_target = line
                spells[current_target] = {'name': line}
                continue
            
            # if current_target.startswith('Force_'):
                # continue
            
            target, value = line.split('=', 1)
            spells[current_target][target] = value.split(',')
    
    with open('gamefiles/spells.json', 'w') as f:
        f.write(json.dumps(
            spells#, sort_keys=True, indent=4, separators=(',', ': ')
        ))


walker()
extract_multi_file()
parse_perks()
parse_enchants()
