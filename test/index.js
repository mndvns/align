var should = require('should');
var align = require('..');
var exec = require('child_process').exec;

describe('align', function(){
  describe('bin', function(){
    var fixtures = [
      'test/fixtures/simple/component.json',
      'test/fixtures/simple/package.json'
    ];
    it('should work', function(done){
      exec('./bin/align ' + fixtures.join(' '), function(err, stdout, stderr){
        if (err) return done(err);
        stdout.should.startWith('{');
        done();
      });
    });
  });

  describe('api', function(){
    it('should work with `component.json`, `package.json`, `ini`', function(done){
      var fixtures = [
        'test/fixtures/simple/component.json',
        'test/fixtures/simple/package.json'
      ];
      align(fixtures, function(err, output){
        if (err) return done(err);
        output.should.have.properties('name', 'keywords', 'main');
        output.name.should.eql('foobar');
        output.keywords.should.eql(['aaa', 'zzz', 'bbb']);
        output.main.should.eql('index.js');
        done();
      });
    });

    it('should work with `json`, `ini`, `Makefile`', function(done){
      var fixtures = [
        'test/fixtures/complex/component.json',
        'test/fixtures/complex/package.json',
        'test/fixtures/complex/Makefile'
      ];
      align(fixtures, function(err, output){
        if (err) return done(err);
        output.should.have.properties('name', 'keywords', 'main', 'stuff');
        output.name.should.eql('foobar');
        output.keywords.should.eql(['aaa', 'zzz', 'bbb']);
        output.main.should.eql('index.js');
        output.stuff.should.eql('cool');
        done();
      });
    });

    it('should return error if mismatched', function(done){
      var fixtures = [
        'test/fixtures/mismatch/component.json',
        'test/fixtures/mismatch/package.json',
        'test/fixtures/mismatch/.dotfile'
      ];
      align(fixtures, function(err, output){
        if (!err) return done(new Error('no error'));
        err.should.be.an.Error;
        err.message.should.startWith('key \'thingy\'');
        done();
      });
    });
  });
});

function addFixture(path){
  return __dirname + '/fixtures/' + path;
}
