<?php

/* phpMyAdmin configuration snippet */

/* Paste it to your config.inc.php */

$cfg['FirstLevelNavigationItems'] = 500;
$cfg['MaxNavigationItems'] = 500;
$cfg['NavigationTreeEnableGrouping'] = false;
$cfg['DisplayServersList'] = true;
$cfg['NavigationWidth'] = 300;
$cfg['ActionLinksMode'] = 'icons';
$cfg['TitleTable'] = '@TABLE@';
$cfg['TitleDatabase'] = '@DATABASE@';
$cfg['TitleServer'] = '@VSERVER@';
$cfg['TitleDefault'] = '@HTTP_HOST@';
$cfg['Console']['Mode'] = 'collapse';
$cfg['ShowAll'] = true;

$cfg['Servers'][1]['hide_db'] = 'information_schema';
