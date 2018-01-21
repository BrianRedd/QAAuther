THE DREAM (GOAL): Build an internal tool to allow easy access to Olive Software customer sites (digital replica newspaper editions)

As many Olive customer sites are authenticated (behind a paywall), Olive developed a methodology to interface with any subscriber/circulation system. Authenticated users are returned to a protected Olive site via an "authenticating" URL, which contains, among the various query string parameters, and MD5 hash value based on a shared secret passphrase. To improve Olive's (and, initially, my own) ability to troubleshoot problems and manage the vast number of client sites we have, I built a tool ("QA Authenticator") that not only lists all of our client sites, but, as needed, will generate the site-specific authenticating URL.

Initially built for my own use, this tool evolved into a company-wide resource for the Professional Services, Production, and Sales departments.

THE THOUGHT PROCESS: Challenges

The first iteration of this tool used a JavaScript include as the data store. As I learned jQuery and its AJAX function, I rebuilt the site using jQuery and jQueryUI, with an XML datastore. I then created an Editor tool to allow Olive personnel to edit the content of this XML datastore. As XML is quite heavy, the next (and current) iteration replaced the XML with a JSON datastore.

THE BUILD:

The QA Authenticator tool has been used at Olive for over ten years, and is currently on version 6.1. Because the full site contains proprietary data, it is not publically accessible. While it does run client-side, it is fully mobile compatible using CSS3 media queries and manually set breakpoints.

In addition to being used internally, certain large multi-publication clients have been granted access to stripped down versions of QAA that allow them only access to their publications.

NOTES:

This GitHub version contains a sample data store; otherwise, it is the full QAA version (including having a copy of the QAA Editor tool)
