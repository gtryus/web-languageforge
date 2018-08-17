import {browser, by, element, ExpectedConditions, protractor} from 'protractor';
import {Utils} from './utils';

export class ProjectsPage {
  private readonly utils = new Utils();

  url = '/app/projects';
  async get() {
    // Driver needs to be added with browser to avoid Warnings inforamtion
    await browser.driver.get(browser.baseUrl + this.url);
  }

  testProjectName = 'Test Project';
  createBtn = element(by.id('startJoinProjectButton'));
  // Or just select "100" from the per-page dropdown, then you're pretty much guaranteed the Test
  // Project will be on page 1, and you can find it.
  itemsPerPageCtrl = element(by.model('itemsPerPage'));
  projectsList = element.all(by.repeater('project in visibleProjects'));
  projectNames = element.all(by.repeater('project in visibleProjects').column('project.projectName'));
  projectTypes = element.all(by.repeater('project in visibleProjects')
      .column('$ctrl.projectTypeNames[project.appName]'));
  showFormButton = element(by.id('sfchecks-invite-friend-btn'));

  async findProject(projectName: string) {
    let foundRow: any;
    const result = protractor.promise.defer();
    const searchName = new RegExp(projectName);
    await this.projectsList.map(async (row: any) => {
      await row.getText().then(async (text: string) => {
      if (searchName.test(text)) {
        foundRow = row;
      }
      }, () => {}); // added block to avoiding warnings of "project not found"
    }).then(async () => {
      if (foundRow) {
        result.fulfill(foundRow);
      } else {
        result.reject('Project ' + projectName + ' not found.');
      }
    }, () => {}); // added block to avoiding warnings of "project not found"

    return result.promise;
  }

  // Calling this method instead of "clickOnProject(projectName: string)" to avoid Promise Errors.
  async clickOnProjectName(projectName: string) {
    const projectLink = element.all(by.cssContainingText('span', projectName)).first();
    await browser.wait(() => projectLink, Utils.conditionTimeout);
    await projectLink.click();
  }

  async clickOnProject(projectName: string) {
      this.findProject(projectName).then(async (projectRow: any) => {
        const projectLink = projectRow.element(by.css('a'));
        await projectLink.getAttribute('href').then(async (url: string) => {
          await browser.get(url);
      }, () => {}); // added block to avoiding warnings of "project not found"
    }, () => {}); // added block to avoiding warnings of "project not found"
  }

  settingsBtn = element(by.id('settingsBtn'));
  userManagementLink = (browser.baseUrl.includes('languageforge')) ?
    element(by.id('userManagementLink')) : element(by.id('dropdown-project-settings'));

  async addUserToProject(projectName: any, usersName: string, roleText: string) {
    // Commented the below code to avoid an error:
    /* this.findProject(projectName).then(async (projectRow: any) => {
      const projectLink = projectRow.element(by.css('a'));
      await projectLink.click(); */
      const projectLink = element.all(by.cssContainingText('span', projectName)).first();
      await projectLink.click();
      await browser.wait(ExpectedConditions.visibilityOf(this.settingsBtn), Utils.conditionTimeout);
      await this.settingsBtn.click();
      await browser.wait(ExpectedConditions.visibilityOf(this.userManagementLink), Utils.conditionTimeout);
      await this.userManagementLink.click();

      const addMembersBtn = element(by.id('addMembersButton'));
      await browser.wait(ExpectedConditions.visibilityOf(addMembersBtn), Utils.conditionTimeout);
      await addMembersBtn.click();
      const newMembersDiv = element(by.id('newMembersDiv'));
      const userNameInput = newMembersDiv.element(by.id('typeaheadInput'));
      await browser.wait(ExpectedConditions.visibilityOf(userNameInput), Utils.conditionTimeout);
      await userNameInput.sendKeys(usersName);

      const typeaheadDiv = element(by.id('typeaheadDiv'));
      const typeaheadItems = typeaheadDiv.all(by.css('ul li'));
      await this.utils.findRowByText(typeaheadItems, usersName).then(async (item: any) => {
        // browser.sleep applied here to avoid error and warning
        await browser.sleep(1000);
        await item.click();
      }, () => {}); // added block to avoiding warnings of "project not found"

      // This should be unique no matter what
      await newMembersDiv.element(by.id('addUserButton')).click();

      // Now set the user to member or manager, as needed
      const projectMemberRows = element.all(by.repeater('user in $ctrl.list.visibleUsers'));
      let foundUserRow: any;
      await projectMemberRows.map(async (row: any) => {
        const nameColumn = row.element(by.binding('user.username'));
        await nameColumn.getText().then((text: string) => {
          if (text === usersName) {
            foundUserRow = row;
          }
        }, () => {}); // added block to avoiding warnings of "project not found"
      }).then(async () => {
        if (foundUserRow) {
          const select = foundUserRow.element(by.css('select:not([disabled])'));
          await Utils.clickDropdownByValue(select, roleText);
        }
      }, () => {}); // added block to avoiding warnings of "project not found"

      await this.get(); // After all is finished, reload projects page
    // });
  }

  //noinspection JSUnusedGlobalSymbols
  async addManagerToProject(projectName: string, usersName: string) {
    await this.addUserToProject(projectName, usersName, 'Manager');
  }

  async addMemberToProject(projectName: string, usersName: string) {
    await this.addUserToProject(projectName, usersName, 'Contributor');
  }

  async removeUserFromProject(projectName: string, userName: string) {
    this.findProject(projectName).then(async (projectRow: any) => {
      const projectLink = projectRow.element(by.css('a'));
      await projectLink.click();

      await this.settingsBtn.click();
      await this.userManagementLink.click();

      let userFilter: any;
      let projectMemberRows: any;
      if (await browser.baseUrl.includes('scriptureforge')) {
        userFilter = element(by.model('userFilter'));
        await userFilter.sendKeys(userName);
        projectMemberRows = await element.all(by.repeater('user in list.visibleUsers'));
      } else if (await browser.baseUrl.includes('languageforge')) {
        userFilter = element(by.model('$ctrl.userFilter'));
        await userFilter.sendKeys(userName);
        projectMemberRows = await element.all(by.repeater('user in $ctrl.list.visibleUsers'));
      }

      const foundUserRow = projectMemberRows.first();
      const rowCheckbox = foundUserRow.element(by.css('input[type="checkbox"]'));
      await this.utils.setCheckbox(rowCheckbox, true);
      const removeMembersBtn = element(by.id('remove-members-button'));
      await removeMembersBtn.click();

      await this.get(); // After all is finished, reload projects page

    }, () => {}); // added block to avoiding warnings of "project not found"
  }
}
