# JiraIssueLinkVisualiser

A Chrome extension that will add an issue link visualisation on the right hand pane when in Atlassian Jira. Requires the REST API to be enabled in JIRA to work!

# Why I built this?
 One day whilst working on an issue I had trouble keeping track of the status of related issues and sub issues without scrolling. This is my attempt at making a visual aid for issue links.

# How to install

* Clone this repository to a directory on your computer
* In Chrome go to Settings>Extensions and enable "Developer Mode"
* Click "Load unpacked extension..." and open the directory where you cloned this repository

## Built with
* [Jquery](https://github.com/jquery/jquery)
* [VivaGraphJS](https://github.com/anvaka/VivaGraphJS/)
* [Material icons](https://material.io/icons/)


## Todo:
- [ ] Add dependency management system (instead of hardcoding)
- [X] Screen centring and zoom on main issue
- [ ] Sprint
- [ ] Epic or Epic Link
- [ ] Age of issue?
- [ ] Issue activity (Number of comments?)
- [X] Fullscreen function
- [X] Collapse module if no issue links found
