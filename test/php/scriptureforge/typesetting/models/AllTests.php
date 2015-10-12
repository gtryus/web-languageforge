<?php
require_once __DIR__ . '/../../../TestConfig.php';
require_once SimpleTestPath . 'autorun.php';

class AllTypesettingModelTests extends TestSuite
{
    public function __construct()
    {
        parent::__construct();
        $this->addFile(TestPath . 'scriptureforge/typesetting/models/TypesettingAssetModel_Test.php');
        $this->addFile(TestPath . 'scriptureforge/typesetting/models/SettingModel_Test.php');
        $this->addFile(TestPath . 'scriptureforge/typesetting/models/SettingTemplateModel_Test.php');
    }

}