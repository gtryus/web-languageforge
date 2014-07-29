<?php

use models\languageforge\lexicon\commands\LexCommentCommands;
use models\languageforge\lexicon\commands\LexEntryCommands;
use models\languageforge\lexicon\commands\LexOptionListCommands;
use models\languageforge\lexicon\commands\LexProjectCommands;
use models\languageforge\lexicon\config\LexiconOptionListItem;
use models\languageforge\lexicon\LexOptionListListModel;
use models\languageforge\lexicon\LexOptionListModel;
use models\languageforge\lexicon\config\LexiconConfigObj;
use models\languageforge\lexicon\Example;
use models\languageforge\lexicon\LexComment;
use models\languageforge\lexicon\LexCommentReply;
use models\languageforge\lexicon\LexEntryModel;
use models\languageforge\lexicon\LexiconProjectModel;
use models\languageforge\lexicon\Sense;
use models\ProjectModel;

require_once(dirname(__FILE__) . '/../../TestConfig.php');
require_once(SimpleTestPath . 'autorun.php');
require_once(TestPath . 'common/MongoTestEnvironment.php');
require_once(dirname(__FILE__) . '/LexTestData.php');

class TestLexOptionListCommands extends UnitTestCase {

	function testUpdateList_newList_createsOK() {
		$e = new LexiconMongoTestEnvironment();
		$e->clean();

		$project = $e->createProject(SF_TESTPROJECT, SF_TESTPROJECTCODE);
		$optionlists = new LexOptionListListModel($project);
		$optionlists->read();

		// Initial project has no optionlists populated
		$this->assertEqual($optionlists->count, 0);

		// Initialized project has part of speech optionlist defined
		$project->initializeNewProject();
		$optionlists->read();
		$this->assertEqual($optionlists->count, 1);
		$initialValue = $optionlists->entries[0]['items'][0]['value'];
		$this->assertEqual($initialValue, 'Adjective (adj)');

		// Swap first and last items of parts of speech list
		$count = count($optionlists->entries[0]['items']);
		$swap = $optionlists->entries[0]['items'][0];
		$optionlists->entries[0]['items'][0] = $optionlists->entries[0]['items'][$count-1];
		$optionlists->entries[0]['items'][$count-1] = $swap;
		LexOptionListCommands::updateList($project->id->asString(), $optionlists->entries[0]);

		$optionlists->read();
		$newValue = $optionlists->entries[0]['items'][0]['value'];
		$this->assertEqual($newValue, 'Verb (v)');

		// Create part of speech list for fruits
		$fruits = array(array('key'=>'a','value'=> 'apple'),
						array('key'=>'b','value'=> 'berry'),
						array('key'=>'c','value'=> 'cherry'),
						array('key'=>'g','value'=> 'grape'),
						array('key'=>'m','value'=> 'mango'),
						array('key'=>'p','value'=> 'pineapple'));
		$data = array('id'=>'',
						'name'=>'List of Fruits',
						'code'=>'fruits',
						'items' => $fruits,
						'canDelete' => false);
		LexOptionListCommands::updateList($project->id->asString(), $data);
		$optionlists->read();

		$this->assertEqual($optionlists->count, 2);
	}

}

?>