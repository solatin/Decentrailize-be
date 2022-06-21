var Ref = (function() {
  var instance;
  function init() {
    var value = [];
    return {
      setValue : function(x) {
        value = x;
      },
      getValue : function() {
        return value;
      }
    };
  }

  return {
    getInstance : function() {
      if (!instance) instance = init();
      return instance;
    }
  }
})();

module.exports = Ref;