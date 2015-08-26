require 'json'
require 'erb'

def mayor_data
    mayors = JSON::parse(File.read('data/mayors.json'))
    titles = mayors.first.keys.reject{ |k| k[-1] != "?" }.map(&:to_s)

    return mayors, titles
end

def measures_data
    return JSON::parse(File.read('data/measures.json'))
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

    def render path
        ERB.new(File.read(path)).result(binding)
    end
end
