'use strict';

var SfProjectPage = function() {
  this.urlprefix = '/app/sfchecks';
  
  this.testData = {
      simpleUsx1 : '<usx version="2.0"> <chapter number="1" style="c" /> <verse number="1" style="v" /> <para style="q1">Blessed is the man</para> <para style="q2">who does not walk in the counsel of the wicked</para> <para style="q1">or stand in the way of sinners</para> </usx>',
      longUsx1   : '<?xml version="1.0" encoding="utf-8"?> <usx version="2.0"> <book code="JHN" style="id">43-JHN-kjv.sfm The King James Version of the Holy Bible Wednesday, October 14, 2009</book> <para style="ide">UTF-8</para> <para style="h">John</para> <para style="mt">The Gospel According to St. John</para> <chapter number="1" style="c" /> <para style="p"> <verse number="1" style="v" />In the beginning was the Word, and the Word was with God, and the Word was God. <verse number="2" style="v" />The same was in the beginning with God. <verse number="3" style="v" />All things were made by him; and without him was not any thing made that was made. <verse number="4" style="v" />In him was life; and the life was the light of men. <verse number="5" style="v" />And the light shineth in darkness; and the darkness comprehended it not.</para> <para style="p" /> <chapter number="2" style="c" /> <para style="p"> <verse number="1" style="v" />And the third day there was a marriage in Cana of Galilee; and the mother of Jesus was there: <verse number="2" style="v" />And both Jesus was called, and his disciples, to the marriage. <verse number="3" style="v" />And when they wanted wine, the mother of Jesus saith unto him, They have no wine. <verse number="4" style="v" />Jesus saith unto her, <char style="wj">Woman, what have I to do with thee? mine hour is not yet come. </char> <verse number="5" style="v" />His mother saith unto the servants, Whatsoever he saith unto you, do <char style="add">it. </char> <verse number="6" style="v" />And there were set there six waterpots of stone, after the manner of the purifying of the Jews, containing two or three firkins apiece.  </para> </usx>'
  };

  this.settingsMenuLink = element(by.css('.hdrnav a.btn i.icon-cog'));
  this.assestsLink = element(by.linkText('Layout'));
  this.get = function(){
    this.settingsMenuLink.click();
    this.assestsLink.click();
  }
  
  this.innerMarginInput = element(by.id('insideMarginInput'));
  this.outerMarginInput = element(by.id('outsideMarginInput'));
  this.topMarginInput = element(by.id('topMarginInput'));
  this.bottomMarginInput = element(by.id('bottomMarginInput'));
  
  this.marginDiv = element(by.id('pageLeftLayout'));
  
  //columns 
  this.columnsTab = element(by.css("[heading='Columns']"));
  
  this.twoBodyColCB = element(by.id('bodyColumnsTwoInput'));
  this.twoTitleColCB = element(by.id('titleColumnsTwoInput'));
  this.TwoIntroColCB = element(by.id('introColumnsTwoInput'));
  this.ColRuleCB = element(by.id('columnGutterRuleInput'));
  
  this.colGutRuleSkipInput = element(by.id("columnGutterRuleSkipInput"));
  this.colShiftInput = element(by.id("columnShiftInput"));
  this.colGutFactorInput = element(by.id("columnGutterFactorInput"));
  
  //header 
  this.headerTab = element(by.css("[heading='Header']"));
  this.runningHeadCB = element(by.id("useRunningHeaderInput"));
  
  this.runningHeadRuleCB = element(by.id("useRunningHeaderRuleInput"));
  this.runningHeadRuleInput = element(by.id("headerPositionRuleInput"));
  
  this.headerPosInput = element(by.id("headerPositionInput"));
  this.runningHeaderRuleInput =  element(by.id("headerPositionRuleInput"));
  
  this.omitChapNumRunHeadCB = element(by.id("omitChapterNumberRHInput"));
  this.runningHeadTitleLeftInput = element(by.id("runningHeaderTitleLeftInput"));
  this.runningHeadTitleCenterInput = element(by.id("runningHeaderTitleCenterInput"));
  this.runningHeadTitleRightInput = element(by.id("runningHeaderTitleRightInput"));
  
  this.showVerseRefCB = element(by.id("showVerseReferencesInput"));
  this.omitBookRefCB = element(by.id("omitBookReferenceInput"));
  this.runningHeadevenLeftInput = element(by.id("runningHeaderEvenLeftInput"));
  this.runningHeadevenCenterInput = element(by.id("runningHeaderEvenCenterInput"));

  this.runningHeadevenRightInput = element(by.id("runningHeaderEvenRightInput"));
  this.runningHeadOddLeftInput = element(by.id("runningHeaderOddLeftInput"));
  this.runningHeadOddCenterInput = element(by.id("runningHeaderOddCenterInput"));
  this.runningHeadOddRightInput = element(by.id("runningHeaderOddRightInput"));


  
  //footer
  this.footerTab = element(by.css("[heading='Footer']"));
  this.runningFootCB = element(by.id("useRunningFooterInput"));
  this.footPosInput = element(by.id("footerPositionInput"));
  
  this.runningFootTitleLeftInput = element(by.id("runningFooterTitleLeftInput"));
  this.runningFootTitleCenterInput = element(by.id("runningFooterTitleCenterInput"));
  this.runningFootTitleRightInput = element(by.id("runningFooterTitleRightInput"));
  
  this.runningFootEvenLeftInput = element(by.id("runningFooterEvenLeftInput"));
  this.runningFootEvenCenterInput = element(by.id("runningFooterEvenCenterInput"));
  this.runningFootEvenRightInput = element(by.id("runningFooterEvenRightInput"));
  
  this.runningFootOddLeftInput = element(by.id("runningFooterOddLeftInput"));
  this.runningFootOddCenterInput = element(by.id("runningFooterOddCenterInput"));
  this.runningFootOddRightInput = element(by.id("runningFooterOddRightInput"));
  
  //Footnotes
  this.footnoteTab = element(by.css("[heading='Footnotes']"));
  this.specialCallerFootCB = element(by.id('useSpecialCallerFootnotesInput'));  
  this.paragFootnotesCB = element(by.id('paragraphedFootnotesInput'));
  
  this.useNumCallFootCB = element(by.id('useNumericCallersFootnotesInput'));
  this.footnoteRuleCB = element(by.id('useFootnoteRuleInput'));
  this.resetPageCallFootCB = element(by.id('pageResetCallersFootnotesInput'));
  this.omitCallInFootCB = element(by.id('omitCallerInFootnotesInput'));
  
  //crossReferences
  this.crossrefTab = element(by.css("[heading='Cross References']"));
  this.specCallCrossrefCB = element(by.id('useSpecialCallerCrossrefsInput'));
  this.useAutoXCallCrossrefCB =element(by.id('useAutoCallerCrossrefsInput'));
  
  this.omitCallInCrossrefCB = element(by.id('omitCallerInCrossrefsInput'));
  this.paragCrossrefCB = element(by.id('paragraphedCrossrefsInput'));
  this.useNumCallCrossrefCB = element(by.id('useNumericCallersCrossrefsInput'));
  
  //editing features
  this.editFeatTab = element(by.css("[heading='Editing Features']"));
  this.diagComponentCB = element(by.id('useDiagnosticInput'));
  this.leadingCB = element(by.id('leadingInput'));
  this.useBackgroundCB = element(by.id('useBackgroundInput'));
  this.watermarkCB = element(by.id('watermarkInput'));
  this.watermarkInput = element(by.id('watermarkTextInput'));
  this.pageboxCB = element(by.id('pageboxInput'));
  this.cropmarksCB = element(by.id('cropmarksInput'));






  
  //print options
  this.printOptionTab = element(by.css("[heading='Print Options']"));
  this.pageSizeCodeInput = element(by.id("pageSizeCodeInput"));
  
  this.pageHeightInput = element(by.id("pageHeightInput"));
  this.pageWidthInput = element(by.id("pageWidthInput"));
  
  this.printerPageSizeCodeInput = element(by.id("printerPageSizeCodeInput"));
  this.docInfoTextCB =element(by.id('useDocInfoInput'));
  this.docInfoTextInput = element(by.id("docInfoTextInput"));

  
  //body text
  this.bodyTextTab = element(by.css("[heading='Body Text']"));
  this.leadingBodyTextInput = element(by.id("bodyTextLeadingInput"));
  this.bodyFontSizeInput = element(by.id("bodyFontSizeInput"));
  this.justiyParagCB = element(by.id('justifyParagraphsInput'));
  this.rightToLeftCB = element(by.id('rightToLeftInput'));
  
  //adv
  this.advTab = element(by.css("[heading='Adv']"));
  this.extraRightMarginInput = element(by.id("extraRightMarginInput"));
  this.chapVerseSepInput = element(by.id("chapterVerseSeperatorInput"));


};
module.exports = new SfProjectPage();