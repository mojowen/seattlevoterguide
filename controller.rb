require 'json'
require 'erb'

def candidate_data
    candidates = JSON::parse(File.read('data/candidates.json'))
    questions = candidates.first.keys.reject{ |k| k[-1] != "?" }.map(&:to_s)
    districts = candidates.group_by{ |ca| ca['ward'] }
    [districts, questions]
end
def measure_data
    JSON::parse(File.read('data/measures.json')).group_by{ |ca| ca['title'] }
end

def _get_ordinal n
    n = n.to_i
    s = ["th","st","nd","rd"]
    v = n % 100
    "#{n}#{(s[(v-20)%10]||s[v]||s[0])}"
end

class Controller

    def initialize
        self.load_config
    end

    def set_meta meta_data=nil
        base_hash = Hash[ @base.to_h.map{ |k,v| [k.to_s, v] } ]
        @meta = base_hash.update(meta_data || {})
        unless @meta['image'].index(@base.url)
            @meta['image'] = URI.join(@base.url, @meta['image'])
        end
        render('_meta.erb')
    end

    def filename
        @filename
    end

    def load_config
        @base = OpenStruct.new JSON::parse(File.read('data/config.json'))
    end

    def index
        @meta_partial = set_meta
        @measures = measure_data
        @districts, @questions = candidate_data
    end

    def counselors counselor
        name = counselor['name']
        link = name.downcase.gsub(' ','-').gsub(/[^a-zA-Z0-9\-]/,'')
        office = "#{_get_ordinal(counselor['ward'])} Ward counselor"
        @anchor =  "@#{counselor['ward']}"
        @filename = "counselors/#{counselor['ward']}-#{link}"
        @meta_partial = set_meta({
            'url' => "#{@base.url}/sharing/#{@filename}",
            'image' => "#{@base.url}/#{counselor['photo']}",
            'title' => "Vote #{name} for Ward #{office}",
            'description' => "Vote #{name} for #{office} - and you should too",
        })
    end

    def measures measure
        @anchor =  (measure['title'].downcase.gsub(' ','-')
                    .gsub(/[^a-zA-Z0-9\-]/,''))
        @filename = "measures/#{measure['choice']}-#{@anchor}"
        @meta_partial = set_meta({
            'url' => "#{@base.url}/sharing/#{@filename}",
            'image' => "#{@base.url}/images/#{measure['choice']}.png",
            'title' => "Vote #{measure['choice']} for #{measure['title']}",
            'description' => ("I'm supporting #{measure['choice']} on "
                              "#{measure['title']}. A "+
                              "#{measure['choice']} Vote means: "+
                              "#{measure['explanation']}"),
        })
    end

    def render path
        ERB.new(File.read(path)).result(binding)
    end
end
