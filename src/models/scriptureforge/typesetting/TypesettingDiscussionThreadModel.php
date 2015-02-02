<?php
namespace models\scriptureforge\typesetting;

use models\mapper\Id;
use models\ProjectModel;
use models\languageforge\lexicon\AuthorInfo;

class TypesettingDiscussionThreadModel extends \models\mapper\MapperModel
{

    const STATUS_OPEN = 'Open';
    const STATUS_RESOLVED = 'Resolved';
    const STATUS_TODO = 'Todo';

    public static function mapper($databaseName)
    {
        static $instance = null;
        if (null === $instance) {
            $instance = new \models\mapper\MongoMapper($databaseName, 'typesettingDiscussions');
        }

        return $instance;
    }

    /**
     *
     * @param ProjectModel $projectModel
     * @param string $id
     */
    public function __construct($projectModel, $id = '')
    {
        $this->setReadOnlyProp('authorInfo');
        $this->setReadOnlyProp('status');
        $this->setPrivateProp('isDeleted');

        $this->id = new Id();
        $this->authorInfo = new AuthorInfo();
        $this->status = self::STATUS_OPEN;
        $this->isDeleted = false;
        $databaseName = $projectModel->databaseName();
        parent::__construct(self::mapper($databaseName), $id);
    }

    /**
     *
     * @var Id
     */
    public $id;

    /**
     *
     * @var string
     */
    public $title;

    /**
     *
     * @var string
     */
    public $associatedItem;

    /**
     * @var AuthorInfo
     */
    public $authorInfo;

    /**
     *
     * @var string
     */
    public $status;

    /**
     *
     * @var boolean
     */
    public $isDeleted;
}
