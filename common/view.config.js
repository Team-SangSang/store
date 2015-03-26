var
config = module.exports = {},

navigationItem = function (opts) {
  var
    defaultOptions = {
      label: '',
      link: ''
    };

  this.label = '';
  this.link = '';

  for ( var i in opts )
    this[i] = opts[i];
};

config.title = '';
config.current = '';

config.menu = {
  left: [
    {link: '/create', label: 'Create'},
    {link: '/tutorial', label: 'Tutorial'},
    {link: '/forum', label: 'Forum'},
    {link: '/showcase', label: 'Showcase'},
    {link: '/market', label: 'Market'}
  ],

  right: []
};

for ( var i in config.menu ) {
  var currentItem = config.menu[i];

  for ( var j = 0, length = currentItem.length; j < length; j++)
    currentItem[j] = new navigationItem(currentItem[j]);
}