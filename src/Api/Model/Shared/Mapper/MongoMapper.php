<?php

/*
 * Note: \MongoDB is the new PHP MongoDB driver (as opposed to the legacy \Mongo) and is essentially two pieces:
 * 1) the \MongoDB\Driver which is installable through PECL (mongodb v1.6)
 * 2) the \MongoDB\Client client library which is installable through Composer (mongodb/mongodb : ^1.0.0)
 *
 * Useful web references for the \MongoDB class and friends
 * PHP MongoDB Driver API Reference (php.net)          http://php.net/manual/en/set.mongodb.php
 * PHP MongoDB Client Library API Generated Docs       http://mongodb.github.io/mongo-php-library/api/
 * PHP MongoDB Client Library API Reference            http://mongodb.github.io/mongo-php-library/
 * MongoDB Documentation                               https://docs.mongodb.org/manual/reference/
 *
 */

namespace Api\Model\Shared\Mapper;

use Palaso\Utilities\CodeGuard;

class MongoMapper
{
    const ID_IN_KEY = 0;
    const ID_IN_DOC = 1;

    /**
     * @param string $databaseName
     * @param string $collectionName
     * @param string $idKey defaults to id
     */
    public function __construct($databaseName, $collectionName, $idKey = 'id')
    {
        $this->_db = MongoStore::connect($databaseName);
        $this->_collection = $this->_db->selectCollection($collectionName);
        $this->_idKey = $idKey;
    }

    /** @var \MongoDB\Database */
    protected $_db;

    /** @var \MongoDB\Collection */
    protected $_collection;

    /** @var string */
    private $_idKey;

    /**
     * Private clone to prevent copies of the singleton.
     */
    private function __clone()
    {
    }

    /**
     * Creates a string suitable for use as a key from the given string $s
     * @param string $s
     * @return string
     */
    public static function makeKey($s)
    {
        $s = str_replace(array(' ', '-', '_'), '', $s);
        return $s;
    }

    /**
     * @return string
     */
    public static function makeId()
    {
        /** @noinspection PhpParamsInspection */
        $id = new \MongoDB\BSON\ObjectID();
        return (string) $id;
    }

    /**
     * Returns the name of the database.
     * @return string
     */
    public function databaseName()
    {
        return (string) $this->_db;
    }

    public static function mongoID($id = '')
    {
        CodeGuard::checkTypeAndThrow($id, 'string');
        if (!empty($id)) {
            return new \MongoDB\BSON\ObjectID($id);
        }
        /** @noinspection PhpParamsInspection */
        return new \MongoDB\BSON\ObjectID();
    }

    /**
     * @param $model
     * @param string $query - Mongo selection query
     * @param array $fields - fields to return (projection)
     * @param array $sortFields
     * @param int $limit
     * @param int $skip
     * @throws \Exception
     */
    public function readListAsModels($model, $query, $fields = array(), $sortFields = array(), $limit = 0, $skip = 0)
    {
        $options = array('projection' => $fields);

        if (count($sortFields)>0) {
            $options['sort'] = $sortFields;
        }
        if ($limit>0) {
            $options['limit'] = $limit;
        }
        if ($skip > 0) {
            $options['skip'] = $skip;
        }
        $cursor = $this->_collection->find($query, $options);

        $data = array();
        $data['totalCount'] = $this->_collection->count($query);
        $data['entries'] = array();
        $ctr = 0;
        foreach ($cursor as $item) {
            if (get_class($model->entries) == 'Api\Model\Shared\Mapper\ArrayOf') {
                $item['id'] = (string) $item['_id'];
                $data['entries'][] = $item;
            } else {
                $data['entries'][(string) $item['_id']] = $item;
            }
            $ctr++;
        }
        $data['count'] = $ctr;
        try {
            MongoDecoder::decode($model, $data);
        } catch (\Exception $ex) {
            CodeGuard::exception('Exception thrown in readListAsModels.  Note: use of this method assumes that you have redefined $this->entries to be of type MapOf or ArrayOf.  Exception thrown while decoding \'' . print_r($data, true) . "'", $ex->getCode(), $ex);
        }

    }

    public function readList($model, $query, $fields = array(), $sortFields = array(), $limit = 0, $skip = 0)
    {
        $projection = array();
        foreach ($fields as $field) {
            $projection[$field] = true;
        }
        $options = array('projection' => $projection);

        if (count($sortFields)>0) {
            $options['sort'] = $sortFields;
        }
        if ($limit>0) {
            $options['limit'] = $limit;
        }
        if ($skip > 0) {
            $options['skip'] = $skip;
        }
        $cursor = $this->_collection->find($query, $options);

        $model->totalCount = $this->_collection->count($query);

        $model->entries = array();
        $ctr = 0;
        foreach ($cursor as $item) {
            $id = strval($item['_id']);
            $item[$this->_idKey] = $id;
            unset($item['_id']);
            $model->entries[] = $item;
            $ctr++;
        }
        $model->count = $ctr;
    }

    public function readCounts($model, $query, $fields = array(), $sortFields = array(), $limit = 0, $skip = 0)
    {
        $options = array('projection' => $fields);

        if (count($sortFields)>0) {
            $options['sort'] = $sortFields;
        }
        if ($limit>0) {
            $options['limit'] = $limit;
        }
        if ($skip > 0) {
            $options['skip'] = $skip;
        }

        $model->totalCount = $this->_collection->count($query);
        $model->count = $this->_collection->count($query, $options);
        $model->entries = array();
    }

    public function findOneByQuery($model, $query, $fields = array())
    {
        $options = array('projection' => $fields);
        $data = $this->_collection->findOne($query, $options);
        if ($data === NULL) {
            return;
        }
        try {
            MongoDecoder::decode($model, $data, (string) $data['_id']);
        } catch (\Exception $ex) {
            throw new \Exception("Exception thrown while reading", $ex->getCode(), $ex);
        }
    }

    /**
     * @param string $id
     * @return bool
     */
    public function exists($id)
    {
        CodeGuard::checkTypeAndThrow($id, 'string');
        try {
            $data = $this->_collection->findOne(array("_id" => self::mongoID($id)));
            if ($data != NULL) {
                return true;
            }
        } catch (\Exception $e) { }
        return false;
    }

    /**
     * @param mixed $model
     * @param string $id
     * @throws \Exception
     */
    public function read($model, $id)
    {
        CodeGuard::checkTypeAndThrow($id, 'string');
        $data = $this->_collection->findOne(array("_id" => self::mongoID($id)));
        if ($data === NULL) {
            $collection = (string) $this->_collection;
            throw new \Exception("Could not find id '$id' in '$collection'");
        }
        try {
            MongoDecoder::decode($model, $data, $id);
        } catch (\Exception $ex) {
            CodeGuard::exception("Exception thrown while decoding " . get_class($model) . "('$id')", $ex->getCode(), $ex);
        }
    }

    /**
     * @param mixed $model
     * @param string $property
     * @param string $value
     * @return bool true on document found, false otherwise
     * Note that unlike the read() method, readByProperty() does NOT throw an exception if no document is found
     *
     */
    public function readByProperty($model, $property, $value)
    {
        CodeGuard::checkTypeAndThrow($property, 'string');
        CodeGuard::checkTypeAndThrow($value, 'string');
        $data = $this->_collection->findOne(array($property => $value));
        if ($data != NULL) {
            MongoDecoder::decode($model, $data, (string) $data['_id']);
            return true;
        }
        return false;
    }

    /**
     * @param mixed $model
     * @param array  $properties
     * @return bool
     */
    public function readByProperties($model, $properties)
    {
        CodeGuard::checkTypeAndThrow($properties, 'array');
        $data = $this->_collection->findOne($properties);
        if ($data != NULL) {
            MongoDecoder::decode($model, $data, (string) $data['_id']);
            return true;
        }
        return false;
    }

    public function readByPropertyArrayContains($model, $property, $value)
    {
        CodeGuard::checkTypeAndThrow($value, 'string');
        $data = $this->_collection->findOne([$property => $value]);  // Yes, it's that simple
        if ($data != NULL) {
            MongoDecoder::decode($model, $data, (string) $data['_id']);
            return true;
        }
        return false;
    }

    public function readSubDocument($model, $rootId, $property, $id)
    {
        CodeGuard::checkTypeAndThrow($rootId, 'string');
        CodeGuard::checkTypeAndThrow($id, 'string');
        $data = $this->_collection->findOne(array("_id" => self::mongoID($rootId)), array('projection' => $property . '.' . $id));
        if ($data === NULL) {
            throw new \Exception("Could not find $property=$id in $rootId");
        }
        // TODO Check this out on nested sub docs > 1
        $data = $data[$property][$id];
        MongoDecoder::decode($model, $data, $id);
    }

    /**
     * @param object $model
     * @param string $id
     * @param int $keyStyle
     * @param string $rootId
     * @param string $property
     * @see ID_IN_KEY
     * @see ID_IN_DOC
     * @return string
     * @throws \Exception
     */
    public function write($model, $id, $keyStyle = MongoMapper::ID_IN_KEY, $rootId = '', $property = '')
    {
        CodeGuard::checkTypeAndThrow($rootId, 'string');
        CodeGuard::checkTypeAndThrow($property, 'string');
        CodeGuard::checkTypeAndThrow($id, 'string');
        $data = MongoEncoder::encode($model); // TODO Take into account key style for stripping key out of the model if needs be
        if (empty($rootId)) {
            // We're doing a root level update, only $model, $id are relevant
            $id = $this->update($data, $id, self::ID_IN_KEY, '', '');
        } else {
            if ($keyStyle == self::ID_IN_KEY) {
                CodeGuard::checkNullAndThrow($id, 'id');
                $id = $this->update($data, $id, self::ID_IN_KEY, $rootId, $property);
            } else {
                if (empty($id)) {
                    // TODO would be nice if the encode above gave us the id it generated so we could return it to be consistent. CP 2013-08
                    throw new \Exception("Method appendSubDocument() is not implemented");
                    //$this->appendSubDocument($data, $rootId, $property);
                } else {
                    $id = $this->update($data, $id, self::ID_IN_DOC, $rootId, $property);
                }
            }
        }
        return $id;
    }

    public function remove($id)
    {
        CodeGuard::checkTypeAndThrow($id, 'string');
        $result = $this->_collection->deleteOne(array('_id' => self::mongoID($id)));
        return $result->getDeletedCount();
    }

    public function dropCollection() {
        $this->_collection->drop();
    }

    public function getCollectionName() {
        return $this->_collection->getCollectionName();
    }

    public function removeSubDocument($rootId, $property, $id)
    {
        CodeGuard::checkTypeAndThrow($rootId, 'string');
        CodeGuard::checkTypeAndThrow($id, 'string');
        $filter = array('_id' => self::mongoID($rootId));
        $updateCommand = array('$unset' => array($property . '.' . $id => ''));
        $result = $this->_collection->updateOne($filter, $updateCommand);
        return $result->getModifiedCount();
    }

    public function removeProperty($property)
    {
        CodeGuard::checkTypeAndThrow($property, 'string');
        $filter = array($property => array('$exists' => true));
        $updateCommand = array('$unset' => array($property => true));
        $result = $this->_collection->updateMany($filter, $updateCommand);
        return $result->getModifiedCount();
    }

    /**
     * Since MongoEncoder::encode returns new \stdClass() instead of an empty array, but empty(new \stdClass()) returns false, we need a different way to detect if an encoded object is empty.
     * See https://stackoverflow.com/questions/9412126/how-to-check-that-an-object-is-empty-in-php
     */
    public static function objectIsEmpty($object) {
        if (is_null($object)) return true;
        foreach ($object as $key) {
            return false;
        }
        return true;
    }

    public static function shouldPersist($value) {
        if (is_null($value))
            return false;
        if (is_bool($value))
            return true;
        if (empty($value))
            return false;
        if (is_object($value) && self::objectIsEmpty($value))
            return false;
        return true;
    }

    public static function shouldKeepKey(string $key) {
        // Some keys shouldn't be removed even if empty, at least as long as our code is still making assumptions that these keys exist
        return ($key === "guid" || $key === "translation" || $key === "description" || $key === "answers" || $key == "paragraphs");
    }

    public static function removeEmptyItems(array $array) {
        foreach ($array as $key => &$value) {
            if (is_array($value)) {
                $value = self::removeEmptyItems($value);
            }
            if (self::shouldPersist($value) || self::shouldKeepKey($key)) {
                $array[$key] = $value;
            } else {
                unset($array[$key]);
            }
        }
        return $array;
    }

    protected function prepareUpdateCommand($data) {
        // Returns two arrays: keysToSet and keysToUnset (both with key => value)
        $keysToSet = [];
        $keysToUnset = [];
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $value = self::removeEmptyItems($value);
            }
            if (self::shouldPersist($value) || self::shouldKeepKey($key)) {
                $keysToSet[$key] = $value;
            } else {
                $keysToUnset[$key] = null;
            }
        }
        return [$keysToSet, $keysToUnset];
    }

    /** Figure out if subdocuments have moved
     * Structure expected for oldData and newData: array of documents that have a unique key
     * Returns a keyed array (dict) with keys being ID values, and values being ["oldPos" => int, "newPos" => int].
     * Only the key is examined; the other parts of the data are not compared
     * E.g., if the input is as follows:
     * $oldData = [ ["id" => "abc", "data" => "foo"], ["id" => "def", "data" => "bar"] ]
     * $newData = [ ["id" => "def", "data" => "bar"], ["id" => "abc", "data" => "new foo"] ]
     * $key = "id"
     * then the result will be:
     * [ "abc" => [ "oldPos" => 0, "newPos" => 1 ], "def" => [ "oldPos" => 1, "newPos" => 0 ] ]
     * If any ID has appeared or disappeared, the oldPos or newPos for that ID will be null.
     * E.g., ["oldPos" => 0, "newPos" => null] means that the item was deleted.
     *
     * WARNING: if keys are duplicated, this function's behavior will be undefined
     *
     * @param array $oldData
     * @param array $newData
     * @param array $keyName
     * @return array
     */
    public static function detectMoved($oldData, $newData, $keyName)
    {
        // TODO: This might be useful in other situations; maybe move it to an ArrayUtils class or something
        $oldPositionsById = [];
        $newPositionsById = [];
        foreach ($oldData as $pos => $value) {
            if (array_key_exists($keyName, $value)) {
                $oldPositionsById[$value[$keyName]] = $pos;
            }
        }
        foreach ($newData as $pos => $value) {
            if (array_key_exists($keyName, $value)) {
                $newPositionsById[$value[$keyName]] = $pos;
            }
        }

        // Most of the time there will be no motion, so check that first
        if ($oldPositionsById === $newPositionsById) {
            return [];
        }

        $result = [];
        foreach ($oldPositionsById as $id => $oldPos) {
            $newPos = $newPositionsById[$id] ?? null;  // Without the "?? null", we'd get an error if the ID didn't exist
            $result[$id] = ["oldPos" => $oldPos, "newPos" => $newPos];
            // Keep track of which keys we've handled
            unset($newPositionsById[$id]);
        }
        // Any remaining IDs in newData are items that were added
        foreach ($newPositionsById as $id => $newPos) {
            $result[$id] = ["oldPos" => null, "newPos" => $newPos];
        }
        return $result;
    }

    /**
     * @param array $data
     * @param string $id
     * @param int $keyType
     * @param string $rootId
     * @param string $property
     * @return string
     */
    protected function update($data, $id, $keyType, $rootId, $property)
    {
        CodeGuard::checkTypeAndThrow($rootId, 'string');
        CodeGuard::checkTypeAndThrow($id, 'string');
        if ($keyType == self::ID_IN_KEY) {
            if (empty($rootId)) {
                $mongoid = self::mongoID($id);
                $filter = array('_id' => $mongoid);
                list($keysToSet, $keysToUnset) = $this->prepareUpdateCommand($data);
                $updateCommand = array('$set' => $keysToSet);
                if (! empty($keysToUnset)) {
                    $updateCommand['$unset'] = $keysToUnset;
                }
                $options = array('upsert' => true);
                $this->_collection->updateOne($filter, $updateCommand, $options);
                $id = $mongoid->__toString();
            } else {
                CodeGuard::checkNullAndThrow($id, 'id');
                CodeGuard::checkNullAndThrow($property, 'property');
                $subKey = $property . '.' . $id;
                $filter = array('_id' => self::mongoID($rootId));
                $updateCommand = array('$set' => array($subKey => $data));
                $this->_collection->updateOne($filter, $updateCommand);
            }
        } else {
            CodeGuard::checkNullAndThrow($id, 'id');
            $filter = array('_id' => self::mongoID($rootId));
            $updateCommand = array('$set' => array($property . '$' . $id => $data));
            $this->_collection->updateOne($filter, $updateCommand);
        }
        return $id;
    }
}
